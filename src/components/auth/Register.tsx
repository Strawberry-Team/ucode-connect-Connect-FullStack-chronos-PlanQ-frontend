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

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(3, 'First name is required')
      .max(100, 'First name must not exceed 100 characters')
      .regex(/^(?!-)[A-Za-z]+(?:-[A-Za-z]+)*$/, 'First name must contain only English letters and may contain hyphen (-)'),
    lastName: z
      .string()
      .max(100, 'Last name must not exceed 100 characters')
      .regex(/^(?!-)[A-Za-z]+(?:-[A-Za-z]+)*$/, 'Last name must contain only English letters and may contain hyphen (-)') // Только английские буквы (или пустое)
      .optional(),
    countryCode: z.string().min(1, 'Country is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter') // Минимум одна заглавная буква
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter') // Минимум одна строчная буква
      .regex(/[0-9]/, 'Password must contain at least one number') // Минимум одна цифра
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'), // Минимум один специальный символ
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
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
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


  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/countries');
        const countryOptions = response.data.map((country: any) => ({
          label: country.name,
          value: country.code,
          flag: country.flag || '',
        }));
        setCountries(countryOptions);
      } catch (err) {
        console.error('Failed to fetch countries:', err);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await axios.get('http://ip-api.com/json');
        const countryCode = response.data.countryCode;
        const country = countries.find((c) => c.value === countryCode);
        if (country) {
          setDefaultCountry(country);
          form.setValue('countryCode', countryCode);
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
     const userData: any = {
      firstName: values.firstName,
      email: values.email,
      password: values.password,
      countryCode: values.countryCode,
    };

    if (values.lastName) {
      userData.lastName = values.lastName;
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        
        <h1 className="text-4xl font-bold text-blue-600 mb-2">PlanQ</h1>
        <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full"></div>
      </div>
    <Card className="w-[400px] shadow-xl bg-white rounded-lg">
      <CardHeader className="space-y-1 pb-4">
        <h2 className="text-2xl font-bold text-center text-blue-600">Create Account</h2>
        <p className="text-sm text-gray-500 text-center">
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
              <Alert variant="default" className="mb-4 border-blue-500 bg-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                <AlertDescription className="text-blue-600">{success}</AlertDescription>
              </Alert>
            )}

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                    <div className="relative">
                                                 <User
                                                     className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                                                 <Input
                                                     placeholder="Enter your first name"
                                                     className="pl-10"
                                                     {...field}
                                                 />
                                             </div>
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
                    <div className="relative">
                                                 <User
                                                     className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                                                 <Input
                                                     placeholder="Enter your last name (optional)"
                                                     className="pl-10"
                                                     {...field}
                                                 />
                                             </div>
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
                        value={defaultCountry}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value || '');
                          setDefaultCountry(selectedOption || null);
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
                    <div className="relative">
                                                 <Mail
                                                     className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                                                 <Input
                                                     type="email"
                                                     placeholder="Enter your email"
                                                     className="pl-10"
                                                     {...field}
                                                 />
                                             </div>
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
                       <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    <div className="relative">
                                                 <Lock
                                                     className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                                                 <Input
                                                     type={showConfirmPassword ? "text" : "password"}
                                                     placeholder="Confirm your password"
                                                     className="pl-10 pr-10"
                                                     {...field}
                                                 />
                                                 <button
                                                     type="button"
                                                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                 >
                                                     {showConfirmPassword ? (
                                                         <EyeOff className="h-4 w-4"/>
                                                     ) : (
                                                         <Eye className="h-4 w-4"/>
                                                     )}
                                                 </button>
                                             </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

<Button type="submit" className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
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
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200"
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
