import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { logout } from '../actions/authActions';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { LogOut, User, Menu, X, Search, Calendar, Clock, Loader2, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { SearchEventResult, SearchEventsResult } from '../services/eventService';
import eventService from "../services/eventService";
import { debounce } from 'lodash';
import { getEvent } from '../actions/eventActions';
import { EventCategory, EventType, TaskPriority, ResponseStatus } from "../types/eventTypes";

function Header() {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchEventResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: number } | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [showEventDetailModal, setShowEventDetailModal] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');
    
    const searchRef = useRef<HTMLDivElement>(null);
    const eventModalRef = useRef<HTMLDivElement>(null);
    
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
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (eventModalRef.current && !eventModalRef.current.contains(event.target as Node)) {
                setShowEventDetailModal(false);
            }
        };
        
        if (showEventDetailModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEventDetailModal]);
    
    const { currentEvent: eventFromStore } = useSelector((state: RootState) => state.event);
    
    useEffect(() => {
        if (selectedEventId) {
            dispatch(getEvent(selectedEventId));
        }
    }, [selectedEventId, dispatch]);
    
    useEffect(() => {
        if (eventFromStore) {
            setCurrentEvent(eventFromStore);
        }
    }, [eventFromStore]);
    
    const debouncedSearch = useRef(
        debounce(async (query: string) => {
            if (query.length >= 3 && user) {
                setIsLoading(true);
                try {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    
                    const results = await eventService.searchEvents(user.id, {
                        startedAt: startDate.toISOString(),
                        endedAt: endDate.toISOString(),
                        name: query
                    });
                    
                    setSearchResults(results.events);
                    setNextCursor(results.nextCursor);
                    setHasMore(results.hasMore);
                    setTotalResults(results.total);
                    setShowResults(true);
                } catch (error) {
                    console.error('Error searching events:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500)
    ).current;
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        debouncedSearch(value);
    };
    
    const loadMoreResults = async () => {
        if (!user || !nextCursor) return;
        
        setIsLoading(true);
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            
            const moreResults = await eventService.searchEvents(user.id, {
                startedAt: startDate.toISOString(),
                endedAt: endDate.toISOString(),
                name: searchQuery,
                after: nextCursor
            });
            
            setSearchResults(prev => [...prev, ...moreResults.events]);
            setNextCursor(moreResults.nextCursor);
            setHasMore(moreResults.hasMore);
        } catch (error) {
            console.error('Error loading more events:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const navigateToEvent = (event: SearchEventResult) => {
        setShowResults(false);
        
        setSelectedEventId(event.id);
        setShowEventDetailModal(true);
        
        setActiveTab('details');
    };

    const handleLogout = () => {
        dispatch(logout());
        setIsMobileMenuOpen(false);
    };

    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'MMM d, yyyy h:mm a');
    };
    
    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'arrangement':
                return <div className="h-4 w-4 flex items-center justify-center text-emerald-600">🗓️</div>;
            case 'task':
                return <div className="h-4 w-4 flex items-center justify-center text-emerald-600">✓</div>;
            case 'reminder':
                return <Clock className="h-4 w-4 text-amber-600" />;
            default:
                return <Calendar className="h-4 w-4 text-gray-600" />;
        }
    };
    
    const renderEventDetailModal = () => {
        if (!currentEvent) return null;
        
        const startDate = new Date(currentEvent.startedAt);
        const endDate = new Date(currentEvent.endedAt);
        const formattedStartDate = format(startDate, "EEE, MMM d, yyyy");
        const formattedStartTime = format(startDate, "h:mm a");
        const formattedEndDate = format(endDate, "EEE, MMM d, yyyy");
        const formattedEndTime = format(endDate, "h:mm a");
        
        const isSameDay = format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
        
        const timeDisplay = isSameDay 
            ? `${formattedStartTime} - ${formattedEndTime}` 
            : `${formattedStartTime}, ${formattedStartDate} - ${formattedEndTime}, ${formattedEndDate}`;
        
        let typeIcon;
        let typeColor;
        let typeBgColor;
        let typeLabel;
        
        switch(currentEvent.type) {
            case EventType.ARRANGEMENT:
                typeIcon = <Calendar className="h-5 w-5" />;
                typeColor = "text-indigo-600";
                typeBgColor = "bg-indigo-50";
                typeLabel = "Arrangement";
                break;
            case EventType.TASK:
                typeIcon = <CheckSquare className="h-5 w-5" />;
                typeColor = "text-emerald-600";
                typeBgColor = "bg-emerald-50";
                typeLabel = "Task";
                break;
            case EventType.REMINDER:
                typeIcon = <Clock className="h-5 w-5" />;
                typeColor = "text-amber-600";
                typeBgColor = "bg-amber-50";
                typeLabel = "Reminder";
                break;
            default:
                typeIcon = <Clock className="h-5 w-5" />;
                typeColor = "text-amber-600";
                typeBgColor = "bg-amber-50";
                typeLabel = "Event";
        }
        
        const eventColor = currentEvent.participations?.[0]?.color || "#4285F4";
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div ref={eventModalRef} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                    <div 
                        className="px-6 py-5 relative overflow-hidden"
                        style={{ 
                            backgroundColor: eventColor,
                            color: '#fff'
                        }}
                    >
                        <div className="absolute -right-12 -top-10 w-32 h-32 rounded-full bg-white opacity-10"></div>
                        <div className="absolute -right-5 -bottom-20 w-40 h-40 rounded-full bg-white opacity-5"></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeBgColor} ${typeColor}`}>
                                        {typeLabel}
                                    </span>
                                    
                                    <span className="flex items-center space-x-1 text-xs text-white/70">
                                        <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                                        <span>{currentEvent.participations?.[0]?.calendarMember?.calendar?.name || "Calendar"}</span>
                                    </span>
                                </div>
                                
                                <h2 className="text-2xl font-bold text-white mb-1 pr-8 break-words">
                                    {currentEvent.name}
                                </h2>
                                
                                <div className="flex items-center text-white/90 text-sm mt-3">
                                    <Clock size={16} className="mr-2" />
                                    <span>{timeDisplay}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowEventDetailModal(false)}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={24} className="text-white" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'details' 
                                        ? `border-indigo-600 text-gray-800` 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                                style={{ 
                                    borderBottomColor: activeTab === 'details' ? eventColor : 'transparent'
                                }}
                            >
                                Details
                            </button>
                            
                            {currentEvent.type === EventType.ARRANGEMENT && (
                                <button
                                    onClick={() => setActiveTab('participants')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                                        activeTab === 'participants' 
                                            ? `border-indigo-600 text-gray-800` 
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                    style={{ 
                                        borderBottomColor: activeTab === 'participants' ? eventColor : 'transparent'
                                    }}
                                >
                                    Participants
                                </button>
                            )}
                        </div>
                        
                        {activeTab === 'details' && (
                            <div className="p-6">
                                {currentEvent.description ? (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                        <p className="text-gray-700 whitespace-pre-line">{currentEvent.description}</p>
                                    </div>
                                ) : (
                                    <div className="mb-6 py-2 px-3 bg-gray-50 rounded-md text-gray-500 text-sm italic">
                                        No description provided
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="w-8 flex items-center justify-center text-gray-400">
                                            {currentEvent.category === EventCategory.HOME ? (
                                                <span className="text-lg">🏠</span>
                                            ) : (
                                                <span className="text-lg">💼</span>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">Category</div>
                                            <div className="text-sm text-gray-500">
                                                {currentEvent.category === EventCategory.HOME ? "Home" : "Work"}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {currentEvent.type === EventType.TASK && currentEvent.task && (
                                        <>
                                            <div className="flex items-center">
                                                <div className="w-8 flex items-center justify-center text-gray-400">
                                                    <span className="text-lg">🚩</span>
                                                </div>
                                                <div className="ml-3 flex items-center">
                                                    <div className="text-sm font-medium text-gray-900 mr-2">Priority:</div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        currentEvent.task.priority === TaskPriority.LOW 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : currentEvent.task.priority === TaskPriority.MEDIUM 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {currentEvent.task.priority ? (currentEvent.task.priority.charAt(0).toUpperCase() + currentEvent.task.priority.slice(1)) : "None"}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center">
                                                <div className="w-8 flex items-center justify-center text-gray-400">
                                                    <CheckSquare size={18} />
                                                </div>
                                                <div className="ml-3 flex items-center">
                                                    <div className="text-sm font-medium text-gray-900 mr-2">Status:</div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        currentEvent.task.isCompleted
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {currentEvent.task.isCompleted ? 'Completed' : 'Incomplete'}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'participants' && currentEvent.type === EventType.ARRANGEMENT && (
                            <div className="p-6">
                                <div className="mb-3">
                                    <h3 className="text-md font-medium text-gray-700">Participants</h3>
                                </div>
                                
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                    {currentEvent.participations && currentEvent.participations.length > 0 ? (
                                        <ul className="divide-y divide-gray-200">
                                            {currentEvent.participations.map((participation: any) => {
                                                if (!participation.calendarMember?.user) return null;
                                                
                                                const participant = participation.calendarMember.user;
                                                return (
                                                    <li key={participation.id} className="p-3 hover:bg-gray-50">
                                                        <div className="flex items-center space-x-3">
                                                            <img
                                                                src={`http://localhost:3000/uploads/avatars/${participant.profilePictureName}`}
                                                                alt="avatar"
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {participant.firstName} {participant.lastName}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {participant.email}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex items-center">
                                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                                    participation.responseStatus === ResponseStatus.ACCEPTED
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : participation.responseStatus === ResponseStatus.DECLINED
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {participation.responseStatus || "Pending"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                                            No participants
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                        <div>
                        </div>
                        
                        <div className="flex space-x-3">
                            
                            
                            <button
                                onClick={() => setShowEventDetailModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-gray-100 shadow-md transition-all duration-300">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    <Link to="/calendar" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <div className="relative h-10 w-10 lg:h-12 lg:w-12">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-700 bg-clip-text text-transparent">
                            PlanQ
                        </h1>
                    </Link>

                    {user && (
                        <div className="hidden lg:block w-1/3 relative" ref={searchRef}>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={() => {
                                        if (searchResults.length > 0) {
                                            setShowResults(true);
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {isLoading && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                    {searchResults.length > 0 ? (
                                        <div>
                                            <div className="pt-2 px-4 text-xs text-gray-500">
                                                Found {totalResults} events
                                            </div>
                                            <ul className="py-2">
                                                {searchResults.map((event) => (
                                                    <li 
                                                        key={event.id} 
                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => navigateToEvent(event)}
                                                    >
                                                        <div className="flex items-start">
                                                            <div className="mr-2 mt-0.5">
                                                                {getEventTypeIcon(event.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm text-gray-900 truncate">
                                                                    {event.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {formatEventDate(event.startedAt)}
                                                                </div>
                                                                {event.description && (
                                                                    <div className="text-xs text-gray-600 mt-1 truncate">
                                                                        {event.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                            
                                            {hasMore && (
                                                <div className="px-4 py-2 border-t border-gray-100">
                                                    <button 
                                                        onClick={loadMoreResults}
                                                        disabled={isLoading}
                                                        className="w-full py-2 text-sm text-center text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                                                    >
                                                        {isLoading ? (
                                                            <span className="flex items-center justify-center">
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Loading...
                                                            </span>
                                                        ) : (
                                                            'Load more'
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-sm text-gray-500 text-center">
                                            {searchQuery.length < 3 ? (
                                                'Type at least 3 characters to search'
                                            ) : (
                                                'No events found'
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <nav className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-2">
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

            {isMobileMenuOpen && (
                <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-gray-100 border-t border-gray-300 overflow-y-auto">
                    <div className="py-4 space-y-2">
                        {user && (
                            <div className="px-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {isLoading && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                
                                {showResults && searchResults.length > 0 && (
                                    <div className="mt-2 bg-white rounded-md shadow-md border border-gray-200 max-h-64 overflow-y-auto">
                                        <ul className="py-2">
                                            {searchResults.map((event) => (
                                                <li 
                                                    key={event.id} 
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => {
                                                        navigateToEvent(event);
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                >
                                                    <div className="flex items-start">
                                                        <div className="mr-2 mt-0.5">
                                                            {getEventTypeIcon(event.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm text-gray-900 truncate">
                                                                {event.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatEventDate(event.startedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {hasMore && (
                                            <div className="px-4 py-2 border-t border-gray-100">
                                                <button 
                                                    onClick={loadMoreResults}
                                                    disabled={isLoading}
                                                    className="w-full py-2 text-sm text-center text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {isLoading ? (
                                                        <span className="flex items-center justify-center">
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Loading...
                                                        </span>
                                                    ) : (
                                                        'Load more'
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
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
            
            {showEventDetailModal && renderEventDetailModal()}
        </header>
    );
}

export default Header;


