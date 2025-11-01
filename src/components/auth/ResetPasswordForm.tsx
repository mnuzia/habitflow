import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ErrorMessage } from './ErrorMessage';

// Schemas
const requestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const updateSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RequestData = z.infer<typeof requestSchema>;
type UpdateData = z.infer<typeof updateSchema>;

export const ResetPasswordForm: React.FC = () => {
  const [mode, setMode] = useState<'request' | 'update'>('request');
  const [formData, setFormData] = useState<RequestData | UpdateData>(
    { email: '' } as RequestData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Parse query params if needed
    const urlParams = new URLSearchParams(window.location.search);

    // Parse hash params
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const type = hashParams.get('type');

    if (type === 'recovery') {
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        // Call API to set session server-side
        fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token, refresh_token }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setServerError(data.error.message || 'Invalid or expired reset link.');
          } else {
            setMode('update');
            setFormData({ newPassword: '', confirmPassword: '' } as UpdateData);
          }
        })
        .catch(() => setServerError('An error occurred while processing the reset link.'));
      } else {
        setServerError('Missing reset tokens in the link.');
      }
    } else if (urlParams.get('type') === 'update') {
      // Optional: if no hash, but keep for fallback
    }
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value } as any));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setSuccessMessage('');

    let result;
    if (mode === 'request') {
      result = requestSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          setServerError(data.error?.message || 'Request failed');
        } else {
          setSuccessMessage(data.data?.message || 'Reset email sent');
        }
      } catch (error) {
        setServerError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    } else {
      result = updateSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: (formData as UpdateData).newPassword }),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          setServerError(data.error?.message || 'Update failed');
        } else {
          setSuccessMessage(data.data?.message || 'Password updated');
          // Redirect to login after success
          setTimeout(() => window.location.href = '/auth/login', 2000);
        }
      } catch (error) {
        setServerError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (mode === 'request') {
    return (
      <>
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
        <p className="text-muted-foreground mb-4">Enter your email to receive a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              autoComplete="off"
              required
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-destructive text-sm" role="alert">{errors.email}</p>}
          </div>

          {serverError && <ErrorMessage message={serverError} />}
          {successMessage && <p className="text-green-600 text-sm" role="alert">{successMessage}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <>Sending...</> : <>Send reset email</>}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Remember your password? <a href="/auth/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </form>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Update Password</h2>
      <p className="text-muted-foreground mb-4">Enter your new password.</p>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={(formData as UpdateData).newPassword}
            onChange={handleChange('newPassword')}
            autoComplete="new-password"
            required
            aria-invalid={!!errors.newPassword}
          />
          {errors.newPassword && <p className="text-destructive text-sm" role="alert">{errors.newPassword}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={(formData as UpdateData).confirmPassword}
            onChange={handleChange('confirmPassword')}
            autoComplete="new-password"
            required
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="text-destructive text-sm" role="alert">{errors.confirmPassword}</p>}
        </div>

        {serverError && <ErrorMessage message={serverError} />}
        {successMessage && <p className="text-green-600 text-sm" role="alert">{successMessage}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <>Updating...</> : <>Update password</>}
        </Button>
      </form>
    </>
  );
};
