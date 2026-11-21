import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, useRequestClose } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Combobox } from '../../components/Combobox';
import { api, keys, type DealInput } from '../../api/endpoints';
import type { Deal } from '../../api/types';
import { handleSaveError } from '../../lib/form-errors';
import { STAGES, STAGE_LABEL, type Stage } from '../../lib/stages';
import { addDays, isValidDate, todayLocal } from '../../lib/dates';
import { stageProbability, useMeta } from '../../lib/hooks';
import { refreshAll } from '../../app/query-client';
import { useToast } from '../../app/toasts';

const VALUE_MESSAGE = 'Enter a value of 0 or more, in whole dollars';
const PROBABILITY_MESSAGE = 'Enter a probability from 0 to 100';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  organizationId: z.number({ message: 'Choose an organization' }).nullable().refine((v) => v !== null, 'Choose an organization'),
  contactId: z.number().nullable(),
  stage: z.enum(STAGES),
  value: z
    .string()
    .transform((v) => v.replace(/[,\s]/g, '').replace(/^USD/i, ''))
    .refine((v) => /^\d+$/.test(v), VALUE_MESSAGE),
  probability: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) <= 100, PROBABILITY_MESSAGE),
  closeDate: z.string().refine(isValidDate, 'Enter the expected close date'),
});
type Values = z.input<typeof schema>;
type Parsed = z.output<typeof schema>;

export interface DealDefaults {
  stage?: Stage;
  organizationId?: number;
  contactId?: number | null;
}

export function DealForm({ record, defaults, onClose }: { record?: Deal; defaults?: DealDefaults; onClose: () => void }) {
  const { data: meta } = useMeta();
  const stage = record?.stage ?? defaults?.stage ?? 'new';
  const form = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: record?.name ?? '',
      organizationId: record?.organizationId ?? defaults?.organizationId ?? null,
      contactId: record ? record.contactId : (defaults?.contactId ?? null),
      stage,
      value: record ? String(record.value) : '',
      probability: String(record?.probability ?? stageProbability(meta, stage)),
      closeDate: record?.closeDate ?? addDays(todayLocal(), 30),
    },
  });
  return (
    <Dialog open onClose={onClose} title={record ? 'Edit deal' : 'New deal'} dirty={form.formState.isDirty}>
      <DealFields form={form} record={record} onClose={onClose} />
    </Dialog>
  );
}

function DealFields({
  form,
  record,
  onClose,
}: {
  form: ReturnType<typeof useForm<Values, unknown, Parsed>>;
  record?: Deal;
  onClose: () => void;
}) {
  const requestClose = useRequestClose();
  const client = useQueryClient();
  const toast = useToast();
  const { data: meta } = useMeta();
  const { data: organizations } = useQuery({ queryKey: keys.organizations, queryFn: api.organizations });
  const { data: contacts } = useQuery({ queryKey: keys.contacts, queryFn: api.contacts });
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError, control, setValue, watch } = form;
  const organizationId = watch('organizationId');

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body: DealInput = {
      name: values.name.trim(),
      organizationId: values.organizationId!,
      contactId: values.contactId,
      stage: values.stage,
      value: Number(values.value),
      probability: Number(values.probability),
      closeDate: values.closeDate,
      today: todayLocal(),
    };
    try {
      await (record ? api.updateDeal(record.id, body) : api.createDeal(body));
      await refreshAll(client);
      toast(record ? 'Deal saved' : 'Deal added');
      onClose();
    } catch (e) {
      setFormError(handleSaveError(e, setError, Object.keys(body)));
    }
  });

  const orgOptions = (organizations ?? []).map((o) => ({ value: o.id, label: o.name }));
  const orgContacts = (contacts ?? []).filter((c) => organizationId !== null && c.organizationId === organizationId);
  const stageField = register('stage');
  const orgName = orgOptions.find((o) => o.value === organizationId)?.label;

  return (
    <form onSubmit={submit} noValidate className="dialog-body">
      <div className="form-grid">
        <Field label="Name" error={formState.errors.name?.message} className="span-2">
          <input className="input" autoComplete="off" {...register('name')} autoFocus />
        </Field>
        <Field label="Organization" error={formState.errors.organizationId?.message}>
          {(controlProps) => (
          <Controller
            control={control}
            name="organizationId"
            render={({ field }) => (
              <Combobox
                {...controlProps}
                options={orgOptions}
                value={field.value}
                onChange={(v) => {
                  if (v !== field.value) setValue('contactId', null, { shouldDirty: true });
                  field.onChange(v);
                }}
                placeholder="Search organizations"
              />
            )}
          />
          )}
        </Field>
        <Field
          label="Main contact"
          optional
          error={formState.errors.contactId?.message}
          hint={organizationId === null ? 'Choose the organization first' : undefined}
        >
          {(controlProps) => (
          <Controller
            control={control}
            name="contactId"
            render={({ field }) => (
              <select
                {...controlProps}
                className="select"
                disabled={organizationId === null}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                onBlur={field.onBlur}
              >
                <option value="">{orgContacts.length || organizationId === null ? 'No main contact' : `No contacts at ${orgName}`}</option>
                {orgContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            )}
          />
          )}
        </Field>
        <Field label="Stage" error={formState.errors.stage?.message}>
          <select
            className="select"
            {...stageField}
            onChange={(e) => {
              void stageField.onChange(e);
              const next = e.target.value as Stage;
              // A stage change sets its usual probability (D2); closing sets the close date to today (D3).
              setValue('probability', String(stageProbability(meta, next)), { shouldDirty: true });
              if ((next === 'won' || next === 'lost') && next !== record?.stage) {
                setValue('closeDate', todayLocal(), { shouldDirty: true });
              }
            }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Close date" error={formState.errors.closeDate?.message}>
          <input className="input" type="date" {...register('closeDate')} />
        </Field>
        <Field label="Value (USD)" error={formState.errors.value?.message}>
          <input className="input num" inputMode="numeric" autoComplete="off" placeholder="0" {...register('value')} />
        </Field>
        <Field label="Probability (%)" error={formState.errors.probability?.message}>
          <input className="input num" inputMode="numeric" autoComplete="off" {...register('probability')} />
        </Field>
      </div>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}
      <div className="dialog-actions">
        <Button onClick={requestClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={formState.isSubmitting}>
          {record ? 'Save' : 'Add deal'}
        </Button>
      </div>
    </form>
  );
}
