import * as React from 'react';
import { Mail, Lock, Github, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    onLoginSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    onForgotPasswordClick?: () => void;
    onGoogleClick?: () => void;
    onGithubClick?: () => void;
}

export function AuthCard({
    title = 'Welcome back',
    description = 'Enter your credential tags to access your custom developer workspace console.',
    onLoginSubmit,
    onForgotPasswordClick,
    onGoogleClick,
    onGithubClick,
    className,
    ...props
}: AuthCardProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (onLoginSubmit) onLoginSubmit(e);
    };

    return (
        <div className={`w-full max-w-[420px] mx-auto ${className || ''}`} {...props}>
            <Card className="border-3 border-brutal rounded-none shadow-brutal bg-white dark:bg-gray-800 p-2">
                <CardHeader className="space-y-2 pb-6 border-b-3 border-brutal bg-gray-50 dark:bg-gray-900/50 p-4">
                    <CardTitle className="text-3xl font-black tracking-tight leading-none text-brutal-fg">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {description}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                    {/* Social OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="w-full font-black text-sm flex items-center justify-center gap-2"
                            onClick={onGoogleClick}
                            type="button"
                        >
                            <Chrome className="h-4 w-4 stroke-[3] text-red-500" />
                            <span>Google</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full font-black text-sm flex items-center justify-center gap-2"
                            onClick={onGithubClick}
                            type="button"
                        >
                            <Github className="h-4 w-4 stroke-[3]" />
                            <span>GitHub</span>
                        </Button>
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-3 border-brutal" />
                        </div>
                        <span className="relative z-10 px-3 bg-white dark:bg-gray-800 font-black text-xs uppercase tracking-wider text-gray-500">
                            or email login
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="auth-email" className="font-black text-sm text-brutal-fg flex items-center gap-2">
                                <Mail className="h-4 w-4 stroke-[2.5]" />
                                <span>Email Address</span>
                            </Label>
                            <Input
                                id="auth-email"
                                type="email"
                                placeholder="name@domain.com"
                                required
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auth-password" className="font-black text-sm text-brutal-fg flex items-center gap-2">
                                    <Lock className="h-4 w-4 stroke-[2.5]" />
                                    <span>Password</span>
                                </Label>
                                <button
                                    onClick={onForgotPasswordClick}
                                    type="button"
                                    className="text-xs font-black underline hover:text-brutal-primary focus:outline-none"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <Input
                                id="auth-password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full"
                            />
                        </div>

                        <Button type="submit" variant="primary" className="w-full py-6 font-black text-base mt-2">
                            Access Account console
                        </Button>
                    </form>
                </CardContent>
                
                <CardFooter className="pt-4 border-t-3 border-brutal bg-gray-50 dark:bg-gray-900/50 p-4 justify-center">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <button type="button" className="font-black underline hover:text-brutal-primary">
                            Register workspace
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
