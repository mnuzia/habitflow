import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ErrorMessage } from './ErrorMessage';

// Schema with password confirmation
const schema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // New state for success message

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setSuccess(false);

    const result = schema.safeParse(formData);
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setServerError(data.error?.message || 'Registration failed');
      } else {
        // Success: Show message, don't redirect yet
        setSuccess(true);
        // Optionally reset form or keep for resend
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setServerError(data.error?.message || 'Failed to resend. Try again.');
      } else {
        // setSuccessMessage(data.data?.message || 'Email resent!'); // Add successMessage state if needed
      }
    } catch (error) {
      setServerError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold mb-6">Registration Successful</h2>
        <p className="text-muted-foreground mb-4">
          We've sent a verification email to {formData.email}. Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
        <Button onClick={handleResend} disabled={loading} className="w-full">
          {loading ? <>Resending...</> : <>Resend Verification Email</>}
        </Button>
        <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
          Register Another Account
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account? <a href="/auth/login" className="text-primary hover:underline">Sign in</a>
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" aria-describedby={serverError ? "error-desc" : undefined}>
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
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-destructive text-sm" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            autoComplete="new-password"
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-destructive text-sm" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            autoComplete="new-password"
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirm-error" className="text-destructive text-sm" role="alert">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {serverError && (
          <div id="error-desc">
            <ErrorMessage message={serverError} />
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <>Creating account...</> : <>Create account</>}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Already have an account? {' '}
          <a href="/auth/login" className="text-primary hover:underline">Sign in</a>
        </p>
      </form>
    </>
  );
};
