import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, useRequestClose } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { api, type ActivityInput } from '../../api/endpoints';
import type { Activity, Ref } from '../../api/types';
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
    },
  });
  return (
    <Dialog open onClose={onClose} title={record ? 'Edit activity' : 'Log activity'} dirty={form.formState.isDirty}>
      <ActivityFields form={form} record={record} target={target} onClose={onClose} />
    </Dialog>
  );
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
  const client = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError, watch, setValue } = form;
  const followUpOn = watch('followUpOn');
  const kind = watch('kind');
  const mainContact = target?.deal?.contact ?? null;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body: ActivityInput = {
      kind: values.kind,
      description: values.description.trim(),
      occurredOn: values.occurredOn,
      followUpOn: values.followUpOn || null,
      done: values.followUpOn ? values.done : false,
    };
    if (!record) {
      if (target?.deal) {
        body.dealId = target.deal.id;
        body.relateToMainContact = values.relateToMainContact;
      } else if (target?.contact) {
        body.contactId = target.contact.id;
      }
    }
    try {
      await (record ? api.updateActivity(record.id, body) : api.createActivity(body));
      await refreshAll(client);
      toast(record ? 'Activity saved' : 'Activity logged');
      onClose();
    } catch (e) {
      setFormError(handleSaveError(e, setError, ['kind', 'description', 'occurredOn', 'followUpOn', 'done']));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="dialog-body">
      {target && !record && (
        <p className="muted small">On {target.deal ? `the deal ${target.deal.name}` : target.contact?.name}</p>
      )}
      <div className="form-grid">
        <fieldset className="field span-2 kind-field">
          <legend className="field-label">Type</legend>
          <div className="segmented" role="radiogroup" aria-label="Type">
            {ACTIVITY_KINDS.map((k) => (
              <label key={k} className={`segment ${kind === k ? 'on' : ''}`}>
                <input type="radio" value={k} {...register('kind')} className="visually-hidden" />
                {KIND_LABEL[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Description" error={formState.errors.description?.message} className="span-2">
          <textarea className="textarea" rows={3} {...register('description')} autoFocus />
        </Field>
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
        {target?.deal && mainContact && !record && (
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
