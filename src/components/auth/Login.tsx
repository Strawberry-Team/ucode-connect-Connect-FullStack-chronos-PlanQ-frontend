import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppDispatch } from '../../store';
import { login } from '../../actions/authActions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Card, CardContent, CardHeader } from '../ui/card';
import { ArrowRight, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[_!@#$%^&*(),.?":{}|<>`]/,
      'Password must contain at least one special character'
    ),
});

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await dispatch(login(values));
      navigate('/');
    } catch (err: any) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 422 ||
        err.response?.status === 404
      ) {
        setError(err.response?.data?.message || 'Invalid email or password.');
      } else {
        setError(err.response?.data?.message || 'Please verify your email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Изменили верстку контейнера: теперь используется justify-start и pt-6 вместо центрации по вертикали
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-100 to-gray-100 pt-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">PlanQ</h1>
        <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full"></div>
      </div>

      <Card className="w-[400px] shadow-xl bg-white rounded-lg">
        <CardHeader className="space-y-1 pb-4">
          <h2 className="text-2xl font-bold text-center text-blue-600">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="mb-4 p-3 bg-red-500 text-white rounded">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Enter your email"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>

                <div className="flex flex-col space-y-2 text-center">
                  <Link
                    to="/reset-password"
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                  <div className="flex items-center justify-center space-x-1 text-sm">
                    <span className="text-gray-500">Don't have an account?</span>
                    <Link
                      to="/register"
                      className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
