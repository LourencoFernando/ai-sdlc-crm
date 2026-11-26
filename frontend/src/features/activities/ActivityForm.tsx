import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AUTOFOCUS, Dialog, useRequestClose } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { api, keys, type ActivityInput } from '../../api/endpoints';
import { Combobox } from '../../components/Combobox';
import type { Activity, Contact, Deal, Ref } from '../../api/types';
import { handleSaveError } from '../../lib/form-errors';
import { ACTIVITY_KINDS, KIND_LABEL, type ActivityKind } from '../../lib/stages';
import { isValidDate, todayLocal } from '../../lib/dates';
import { refreshAll } from '../../app/query-client';
import { useToast } from '../../app/toasts';

const schema = z.object({
  kind: z.enum(ACTIVITY_KINDS),
  description: z.string().trim().min(1, 'Enter a description'),
  occurredOn: z.string().refine(isValidDate, 'Enter the date it happened'),
  followUpOn: z.string().refine((v) => v === '' || isValidDate(v), 'Enter the follow-up date'),
  done: z.boolean(),
  relateToMainContact: z.boolean(),
  /** Chosen in the form only when it's opened without a contact or deal (from the dashboard). */
  contactId: z.number().nullable(),
  dealId: z.number().nullable(),
});
type Values = z.infer<typeof schema>;

/** What the activity is logged on: a contact, or a deal with its main contact. */
export interface ActivityTarget {
  contact?: Ref;
  deal?: Ref & { contact: Ref | null };
}

export function ActivityForm({
  record,
  target,
  onClose,
}: {
  record?: Activity;
  target?: ActivityTarget;
  onClose: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: (record?.kind as ActivityKind) ?? 'note',
      description: record?.description ?? '',
      occurredOn: record?.occurredOn ?? todayLocal(),
      followUpOn: record?.followUpOn ?? '',
      done: record?.done ?? false,
      relateToMainContact: true,
      contactId: null,
      dealId: null,
    },
  });
  return (
    <Dialog open onClose={onClose} title={record ? 'Edit activity' : 'Log activity'} dirty={form.formState.isDirty}>
      <ActivityFields form={form} record={record} target={target} onClose={onClose} />
    </Dialog>
  );
}

/** Where a new activity goes: a target contact or deal, or 'choose' when the form picks one. 'edit' for an existing activity. */
type ActivityOn = 'edit' | 'choose' | ActivityTarget;

function activityOn(target: ActivityTarget | undefined): 'choose' | ActivityTarget {
  return target?.deal || target?.contact ? target : 'choose';
}

function targetName(target: ActivityTarget): string | undefined {
  return target.deal ? `the deal ${target.deal.name}` : target.contact?.name;
}

function ActivityFields({
  form,
  record,
  target,
  onClose,
}: {
  form: ReturnType<typeof useForm<Values>>;
  record?: Activity;
  target?: ActivityTarget;
  onClose: () => void;
}) {
  const requestClose = useRequestClose();
  const { register, formState } = form;
  const on = record ? 'edit' : activityOn(target);
  const choose = on === 'choose';
  const contacts = useQuery({ queryKey: keys.contacts, queryFn: api.contacts, enabled: choose });
  const deals = useQuery({ queryKey: keys.deals, queryFn: api.deals, enabled: choose });
  const mainContact = useMainContact(form, choose ? (deals.data ?? []) : null, target);
  const { submit, formError } = useSubmitActivity(form, on, record, onClose);

  return (
    <form onSubmit={submit} noValidate className="dialog-body">
      {typeof on === 'object' && <p className="muted small">On {targetName(on)}</p>}
      <div className="form-grid">
        {choose && <RecordChooser form={form} contacts={contacts.data ?? []} deals={deals.data ?? []} />}
        <KindPicker form={form} />
        <Field label="Description" error={formState.errors.description?.message} className="span-2">
          <textarea className="textarea" rows={3} {...register('description')} {...AUTOFOCUS} />
        </Field>
        <DateFields form={form} />
        {mainContact && !record && (
          <label className="checkbox-row span-2">
            <input type="checkbox" className="checkbox" {...register('relateToMainContact')} />
            Also show on {mainContact.name}'s timeline
          </label>
        )}
      </div>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="dialog-actions">
        <Button onClick={requestClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={formState.isSubmitting}>
          {record ? 'Save' : 'Log activity'}
        </Button>
      </div>
    </form>
  );
}

/**
 * The main contact the activity will also relate to (A2): the target deal's, or, when choosing
 * from the dashboard, the chosen deal's while no contact is chosen. `chooseFrom` is null when not choosing.
 */
function useMainContact(
  form: ReturnType<typeof useForm<Values>>,
  chooseFrom: Deal[] | null,
  target: ActivityTarget | undefined,
): Ref | null {
  const chosenDealId = form.watch('dealId');
  const chosenContactId = form.watch('contactId');
  if (!chooseFrom) return target?.deal?.contact ?? null;
  if (chosenContactId !== null) return null;
  return chooseFrom.find((d) => d.id === chosenDealId)?.contact ?? null;
}

/** What gets saved. `on` is 'edit' for an existing activity, 'choose' when picked in the form, or the target. */
function activityBody(values: Values, on: ActivityOn): ActivityInput {
  const body: ActivityInput = {
    kind: values.kind,
    description: values.description.trim(),
    occurredOn: values.occurredOn,
    followUpOn: values.followUpOn || null,
    done: values.followUpOn ? values.done : false,
  };
  if (on === 'edit') return body;
  if (on === 'choose') {
    // With a deal and no contact chosen, the deal's main contact is related unless unticked (A2).
    return {
      ...body,
      contactId: values.contactId,
      dealId: values.dealId,
      relateToMainContact: values.contactId === null && values.relateToMainContact,
    };
  }
  if (on.deal) return { ...body, dealId: on.deal.id, relateToMainContact: values.relateToMainContact };
  if (on.contact) return { ...body, contactId: on.contact.id };
  return body;
}

/** Picks the contact or deal when the form is opened from the dashboard. */
function RecordChooser({
  form,
  contacts,
  deals,
}: {
  form: ReturnType<typeof useForm<Values>>;
  contacts: Contact[];
  deals: Deal[];
}) {
  return (
    <>
      <Field label="Contact" optional error={form.formState.errors.contactId?.message}>
        {(controlProps) => (
          <Controller
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <Combobox
                {...controlProps}
                options={contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search contacts"
                noneLabel="No contact"
              />
            )}
          />
        )}
      </Field>
      <Field label="Deal" optional>
        {(controlProps) => (
          <Controller
            control={form.control}
            name="dealId"
            render={({ field }) => (
              <Combobox
                {...controlProps}
                options={deals.map((d) => ({ value: d.id, label: `${d.name} · ${d.organization.name}` }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search deals"
                noneLabel="No deal"
              />
            )}
          />
        )}
      </Field>
    </>
  );
}

function useSubmitActivity(
  form: ReturnType<typeof useForm<Values>>,
  on: ActivityOn,
  record: Activity | undefined,
  onClose: () => void,
) {
  const client = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { handleSubmit, setError } = form;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    if (on === 'choose' && !values.contactId && !values.dealId) {
      setError('contactId', { type: 'required', message: 'Choose a contact or a deal' });
      return;
    }
    const body = activityBody(values, on);
    try {
      await (record ? api.updateActivity(record.id, body) : api.createActivity(body));
      await refreshAll(client);
      toast(record ? 'Activity saved' : 'Activity logged');
      onClose();
    } catch (e) {
      setFormError(handleSaveError(e, setError, ['kind', 'description', 'occurredOn', 'followUpOn', 'done']));
    }
  });
  return { submit, formError };
}

function KindPicker({ form }: { form: ReturnType<typeof useForm<Values>> }) {
  const kind = form.watch('kind');
  return (
    <fieldset className="field span-2 kind-field">
      <legend className="field-label">Type</legend>
      <div className="segmented" role="radiogroup" aria-label="Type">
        {ACTIVITY_KINDS.map((k) => (
          <label key={k} className={`segment ${kind === k ? 'on' : ''}`}>
            <input type="radio" value={k} {...form.register('kind')} className="visually-hidden" />
            {KIND_LABEL[k]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function DateFields({ form }: { form: ReturnType<typeof useForm<Values>> }) {
  const { register, formState, watch, setValue } = form;
  const followUpOn = watch('followUpOn');
  return (
    <>
      <Field label="Date it happened" error={formState.errors.occurredOn?.message}>
        <input className="input" type="date" {...register('occurredOn')} />
      </Field>
      <Field label="Follow-up date" optional error={formState.errors.followUpOn?.message}>
        <input
          className="input"
          type="date"
          {...register('followUpOn', {
            onChange: (e) => {
              if (!e.target.value) setValue('done', false);
            },
          })}
        />
      </Field>
      {followUpOn && (
        <label className="checkbox-row span-2">
          <input type="checkbox" className="checkbox" {...register('done')} />
          Follow-up done
        </label>
      )}
    </>
  );
}
