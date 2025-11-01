import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ErrorMessage } from './ErrorMessage';

// Reuse SigninSchema from types
const schema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

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
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        const errorCode = data.error?.code;
        if (errorCode === 'EMAIL_NOT_CONFIRMED') { // Map Supabase error
          setServerError('Please verify your email first. Didn\'t receive it? <button onClick={handleResend}>Resend</button>');
        } else {
          setServerError(data.error?.message || 'Login failed');
        }
      } else {
        // Success, redirect to dashboard or home
        window.location.href = '/'; // or /habits if exists
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // Similar to register, but use email from form or state
    // For simplicity, assume email is entered; call resend with it
    if (!formData.email) return;
    // ... fetch to resend, show message ...
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Login</h2>
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
            autoComplete="off"
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

        {serverError && <ErrorMessage message={serverError} />}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <>Signing in...</> : <>Sign in</>}
        </Button>

        <div className="text-center space-y-2">
          <a href="/auth/reset-password" className="text-sm text-primary hover:underline">
            Forgot your password?
          </a>
          <p className="text-sm text-muted-foreground">
            Don't have an account? {' '}
            <a href="/auth/register" className="text-primary hover:underline">Sign up</a>
          </p>
        </div>
      </form>
    </>
  );
};
