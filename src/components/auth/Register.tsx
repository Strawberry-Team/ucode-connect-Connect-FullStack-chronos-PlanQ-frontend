import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import axios from 'axios';
import { AppDispatch } from '../../store';
import { register as registerUser } from '../../actions/authActions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowRight, Mail, Lock, User, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

// Схема валидации с использованием Zod
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters'),
    countryCode: z.string().min(1, 'Country is required'), // Код страны
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const Register = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<{ label: string; value: string; flag: string }[]>([]);
  const [defaultCountry, setDefaultCountry] = useState<{ label: string; value: string; flag: string } | null>(null);


  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      countryCode: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Получение списка стран с сервера
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/countries');
        const countryOptions = response.data.map((country: any) => ({
          label: country.name, // Только название страны
          value: country.code, // Код страны
          flag: country.flag || '', // Флаг страны
        }));
        setCountries(countryOptions);
      } catch (err) {
        console.error('Failed to fetch countries:', err);
      }
    };

    fetchCountries();
  }, []);

  // Получение страны пользователя по IP
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await axios.get('http://ip-api.com/json'); // API для геолокации
        const countryCode = response.data.countryCode; // Код страны
        const country = countries.find((c) => c.value === countryCode);
        if (country) {
          setDefaultCountry(country);
          form.setValue('countryCode', countryCode); // Установить значение по умолчанию
        }
      } catch (err) {
        console.error('Failed to fetch user country:', err);
      }
    };

    fetchUserCountry();
  }, [countries]);

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    console.log('Submitted values:', values);
    setIsLoading(true);
    try {
      // Формируем данные для отправки на сервер
    const userData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      countryCode: values.countryCode, // Код страны
    };
    console.log('Data sent to server:', userData);

      await dispatch(registerUser(userData));
      setSuccess('Registration successful! Please check your email to confirm your account.');
      setError(null);
      form.reset();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A user with this email already exists. Please use another email.');
      } else {
        setError('Registration failed. Please try again later.');
      }
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-[400px] shadow-xl bg-background/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <h2 className="text-2xl font-bold text-center text-foreground">Create Account</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your details to create a new account
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default" className="mb-4 border-primary/50 bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary mr-2" />
                  <AlertDescription className="text-primary">{success}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Select
                        options={countries}
                        placeholder="Select your country"
                        value={defaultCountry} // Установить значение по умолчанию
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value || '');
                          setDefaultCountry(selectedOption || null); // Обновить выбранную страну
                        }}
                        getOptionLabel={(e) => (
                          <div className="flex items-center">
                            <img
                              src={e.flag}
                              alt=""
                              style={{ width: 20, height: 15, marginRight: 10 }}
                            />
                           <span style={{ fontSize: '13px' }}>{e.label}</span>
                          </div>
                        )}
                        filterOption={(option, inputValue) =>
                          option.data.label.toLowerCase().includes(inputValue.toLowerCase())
                        }
                        
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
