import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Dialog, useRequestClose } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Combobox } from '../../components/Combobox';
import { api, keys, type ContactInput } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import type { Contact, Ref } from '../../api/types';
import { emptyToNull, handleSaveError } from '../../lib/form-errors';
import { CONTACT_STATUSES, STATUS_LABEL, type ContactStatus } from '../../lib/stages';
import { refreshAll } from '../../app/query-client';
import { useToast } from '../../app/toasts';

const schema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name'),
  lastName: z.string().trim().min(1, 'Enter a last name'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address'),
  phone: z.string(),
  jobTitle: z.string(),
  organizationId: z.number().nullable(),
  status: z.enum(CONTACT_STATUSES),
});
type Values = z.infer<typeof schema>;

export interface ContactDefaults {
  organizationId?: number | null;
  status?: ContactStatus;
}

export function ContactForm({
  record,
  defaults,
  onClose,
}: {
  record?: Contact;
  defaults?: ContactDefaults;
  onClose: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: record?.firstName ?? '',
      lastName: record?.lastName ?? '',
      email: record?.email ?? '',
      phone: record?.phone ?? '',
      jobTitle: record?.jobTitle ?? '',
      organizationId: record ? record.organizationId : (defaults?.organizationId ?? null),
      status: record?.status ?? defaults?.status ?? 'lead',
    },
  });
  return (
    <Dialog open onClose={onClose} title={record ? 'Edit contact' : 'New contact'} dirty={form.formState.isDirty}>
      <ContactFields form={form} record={record} onClose={onClose} />
    </Dialog>
  );
}

function ContactFields({
  form,
  record,
  onClose,
}: {
  form: ReturnType<typeof useForm<Values>>;
  record?: Contact;
  onClose: () => void;
}) {
  const requestClose = useRequestClose();
  const client = useQueryClient();
  const toast = useToast();
  const { data: organizations } = useQuery({ queryKey: keys.organizations, queryFn: api.organizations });
  const [formError, setFormError] = useState<string | null>(null);
  // Deals that will lose this contact as main contact if the organization change goes ahead.
  const [unlink, setUnlink] = useState<Ref[] | null>(null);
  const { register, handleSubmit, formState, setError, control, getValues } = form;

  async function save(values: Values, confirmUnlink: boolean) {
    setFormError(null);
    const body: ContactInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: emptyToNull(values.email),
      phone: emptyToNull(values.phone),
      jobTitle: emptyToNull(values.jobTitle),
      organizationId: values.organizationId,
      status: values.status,
      ...(confirmUnlink ? { confirmUnlink: true } : {}),
    };
    try {
      if (record && !confirmUnlink && values.organizationId !== record.organizationId) {
        const preview = await api.organizationChangePreview(record.id, values.organizationId);
        if (preview.deals.length > 0) {
          setUnlink(preview.deals);
          return;
        }
      }
      await (record ? api.updateContact(record.id, body) : api.createContact(body));
      await refreshAll(client);
      toast(record ? 'Contact saved' : 'Contact added');
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && Array.isArray(e.body.deals)) {
        setUnlink(e.body.deals as Ref[]);
        return;
      }
      setUnlink(null);
      setFormError(handleSaveError(e, setError, Object.keys(body)));
    }
  }

  const submit = handleSubmit((values) => save(values, false));
  const orgOptions = (organizations ?? []).map((o) => ({ value: o.id, label: o.name }));
  const newOrgName = orgOptions.find((o) => o.value === getValues('organizationId'))?.label;

  if (unlink) {
    const name = `${getValues('firstName')} ${getValues('lastName')}`.trim();
    return (
      <div className="dialog-body">
        <p>
          {name} is the main contact on {unlink.length === 1 ? 'this deal' : `these ${unlink.length} deals`} at{' '}
          {record?.organization?.name ?? 'their organization'}. Moving them {newOrgName ? `to ${newOrgName}` : 'out of it'}{' '}
          leaves {unlink.length === 1 ? 'it' : 'them'} without a main contact:
        </p>
        <ul>
          {unlink.map((d) => (
            <li key={d.id}>
              <Link to={`/deals/${d.id}`} onClick={onClose}>
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="dialog-actions">
          <Button onClick={() => setUnlink(null)}>Back</Button>
          <Button variant="primary" onClick={() => save(getValues(), true)}>
            Save and remove from {unlink.length === 1 ? 'deal' : 'deals'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="dialog-body">
      <div className="form-grid">
        <Field label="First name" error={formState.errors.firstName?.message}>
          <input className="input" autoComplete="off" {...register('firstName')} autoFocus />
        </Field>
        <Field label="Last name" error={formState.errors.lastName?.message}>
          <input className="input" autoComplete="off" {...register('lastName')} />
        </Field>
        <Field label="Email" optional error={formState.errors.email?.message}>
          <input className="input" type="email" autoComplete="off" {...register('email')} />
        </Field>
        <Field label="Phone" optional error={formState.errors.phone?.message}>
          <input className="input" type="tel" autoComplete="off" {...register('phone')} />
        </Field>
        <Field label="Job title" optional error={formState.errors.jobTitle?.message}>
          <input className="input" autoComplete="off" {...register('jobTitle')} />
        </Field>
        <Field label="Status" error={formState.errors.status?.message}>
          <select className="select" {...register('status')}>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Organization" optional error={formState.errors.organizationId?.message} className="span-2">
          {(controlProps) => (
          <Controller
            control={control}
            name="organizationId"
            render={({ field }) => (
              <Combobox
                {...controlProps}
                options={orgOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search organizations"
                noneLabel="No organization"
              />
            )}
          />
          )}
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
          {record ? 'Save' : 'Add contact'}
        </Button>
      </div>
    </form>
  );
}
