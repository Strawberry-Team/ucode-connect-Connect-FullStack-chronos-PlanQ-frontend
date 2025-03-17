import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { logout } from '../actions/authActions';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

function Header() {
    const user = useSelector((state: RootState) => state.auth.user);
    
    console.log(user);
    const dispatch = useDispatch<AppDispatch>();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 1);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        dispatch(logout());
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-gray-100 shadow-md transition-all duration-300">
            <div className="container mx-auto px-6"> {/* Добавлен класс px-6 для отступов */}
                <div className="flex justify-between items-center h-16 lg:h-20">
                    {/* Название проекта */}
                    <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-700 bg-clip-text text-transparent">
                            PlanQ
                        </h1>
                    </Link>

                    {/* Строка поиска (только для авторизованных пользователей) */}
                    {user && (
                        <div className="hidden lg:block w-1/3">
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Навигация */}
                    <nav className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-2">
                                {/* Аватар и меню профиля */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                            <Avatar
                                                className="h-10 w-10 ring-2 ring-blue-500/20 transition-all hover:ring-blue-500/40"
                                            >
                                                <AvatarImage
                                                    src={`http://localhost:3000/uploads/avatars/${user.profilePictureName}`}
                                                    alt={user.firstName}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback
                                                    className="bg-gradient-to-br from-blue-700 to-blue-700 text-white"
                                                >
                                                    {user.firstName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <div className="flex flex-col p-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.profilePictureUrl} alt={user.firstName} />
                                                    <AvatarFallback>
                                                        {user.firstName.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{user.firstName}</span>
                                                    <span className="text-xs text-gray-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="gap-2">
                                            <Link to="/profile">
                                                <User className="h-4 w-4" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="gap-2 text-red-500 focus:text-red-500"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <Button asChild className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700" variant="default">
                                <Link to="/login">Login</Link>
                            </Button>
                        )}
                    </nav>

                    {/* Кнопка мобильного меню */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Мобильное меню */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-gray-100 border-t border-gray-300 overflow-y-auto">
                    <div className="py-4 space-y-2">
                        {user && (
                            <div className="px-4">
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        {user ? (
                            <>
                                <div className="px-4 py-2">
                                    <div className="flex items-center space-x-2">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.profilePictureUrl} alt={user.firstName} />
                                            <AvatarFallback>{user.firstName.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{user.firstName}</span>
                                            <span className="text-xs text-gray-500">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    to="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-200 rounded-md"
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-4 py-2 text-sm text-red-500 hover:bg-gray-200 rounded-md w-full"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="px-4">
                                <Button asChild variant="default" className="w-full">
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                        Login
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
