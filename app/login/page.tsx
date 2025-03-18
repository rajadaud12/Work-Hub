'use client';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Added import
import { EyeIcon, EyeOffIcon } from 'lucide-react';

type FormData = {
  email: string;
  password: string;
};

export default function Login() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log in');
      }
      const { token } = await response.json();
      localStorage.setItem('token', token);
      router.push('/');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Head>
        <title>Log In | TaskBoard Hub</title>
        <meta name="description" content="Log in to TaskBoard Hub to access your task boards." />
      </Head>
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Log in to your TaskBoard Hub account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                {...register('email', { 
                  required: 'Email is required', 
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } 
                })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="your@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Sign In
            </button>

            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{' '}
              <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create an account
              </a>
            </p>
          </form>
        </div>
      </div>
      
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-center items-center">
        <div className="max-w-lg text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">TaskBoard Hub</h2>
          <p className="text-xl mb-12 text-white leading-relaxed">Collaborate and manage tasks with your team efficiently. Boost productivity with our intuitive interface.</p>
        </div>
        <Image 
          src="/illustration.svg" 
          alt="TaskBoard Hub Illustration" 
          width={300}
          height={300} // Added height
          className="max-w-md h-auto" 
        />
        <div className="mt-12 flex gap-4">
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <p className="text-sm font-medium mb-1 text-black">Streamlined Workflow</p>
            <p className="text-xs text-black opacity-90">Organize your tasks with ease</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <p className="text-sm font-medium mb-1 text-black">Team Collaboration</p>
            <p className="text-xs text-black opacity-90">Work together seamlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
}