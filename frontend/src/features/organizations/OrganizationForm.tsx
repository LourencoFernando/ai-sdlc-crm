import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { AUTOFOCUS, Dialog, useRequestClose } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { api } from '../../api/endpoints';
import type { Organization } from '../../api/types';
import { useMeta } from '../../lib/hooks';
import { emptyToNull, handleSaveError } from '../../lib/form-errors';
import { refreshAll } from '../../app/query-client';
import { useToast } from '../../app/toasts';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  website: z.string(),
  industry: z.string(),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

export function OrganizationForm({ record, onClose }: { record?: Organization; onClose: () => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: record?.name ?? '',
      website: record?.website ?? '',
      industry: record?.industry ?? '',
      notes: record?.notes ?? '',
    },
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={record ? 'Edit organization' : 'New organization'}
      dirty={form.formState.isDirty}
    >
      <OrganizationFields form={form} record={record} onClose={onClose} />
    </Dialog>
  );
}

function OrganizationFields({
  form,
  record,
  onClose,
}: {
  form: ReturnType<typeof useForm<Values>>;
  record?: Organization;
  onClose: () => void;
}) {
  const requestClose = useRequestClose();
  const { data: meta } = useMeta();
  const client = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError } = form;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      name: values.name.trim(),
      website: emptyToNull(values.website),
      industry: emptyToNull(values.industry),
      notes: emptyToNull(values.notes),
    };
    try {
      await (record ? api.updateOrganization(record.id, body) : api.createOrganization(body));
      await refreshAll(client);
      toast(record ? 'Organization saved' : 'Organization added');
      onClose();
    } catch (e) {
      setFormError(handleSaveError(e, setError, Object.keys(body)));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="dialog-body">
      <div className="form-grid">
        <Field label="Name" error={formState.errors.name?.message} className="span-2">
          <input className="input" {...register('name')} {...AUTOFOCUS} />
        </Field>
        <Field label="Website" optional error={formState.errors.website?.message}>
          <input className="input" placeholder="https://" {...register('website')} />
        </Field>
        <Field label="Industry" optional error={formState.errors.industry?.message}>
          <select className="select" {...register('industry')}>
            <option value="">No industry</option>
            {meta?.industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes" optional error={formState.errors.notes?.message} className="span-2">
          <textarea className="textarea" rows={3} {...register('notes')} />
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
          {record ? 'Save' : 'Add organization'}
        </Button>
      </div>
    </form>
  );
}
