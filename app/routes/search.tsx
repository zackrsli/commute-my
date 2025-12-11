import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate, Link } from "react-router";
import { TransitionWrapper } from "~/components/TransitionWrapper";
import type { Route } from "./+types/search";
import { searchRoutes, type Location, type PlanResponse } from "~/lib/motis";
import { Button } from "~/components/Button";
import { LocationAutocomplete } from "~/components/LocationAutocomplete";
import { LucideLoader2, LucideArrowLeftFromLine, LucideTrain, LucideClock, LucideCircleDot, LucideMapPin, LucideArrowRight, LucideCalendar } from "lucide-react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Search Results" },
    ];
}

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const originLat = parseFloat(searchParams.get("fromLat") || "");
    const originLng = parseFloat(searchParams.get("fromLng") || "");
    const originName = searchParams.get("fromName") || "";
    const originId = searchParams.get("fromId") || undefined;
    const destLat = parseFloat(searchParams.get("toLat") || "");
    const destLng = parseFloat(searchParams.get("toLng") || "");
    const destName = searchParams.get("toName") || "";
    const destId = searchParams.get("toId") || undefined;

    const [originValue, setOriginValue] = useState(originName);
    const [destValue, setDestValue] = useState(destName);

    const departureDateParam = searchParams.get("departureDate");
    const departureTimeParam = searchParams.get("departureTime");
    
    const getDefaultDate = () => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    };
    
    const getDefaultTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    
    const [departureDate, setDepartureDate] = useState(departureDateParam || getDefaultDate());
    const [departureTime, setDepartureTime] = useState(departureTimeParam || getDefaultTime());

    useEffect(() => {
        setOriginValue(originName);
    }, [originName]);

    useEffect(() => {
        setDestValue(destName);
    }, [destName]);
    
    useEffect(() => {
        if (departureDateParam) {
            setDepartureDate(departureDateParam);
        }
        if (departureTimeParam) {
            setDepartureTime(departureTimeParam);
        }
    }, [departureDateParam, departureTimeParam]);

    const origin: Location | null = 
        !isNaN(originLat) && !isNaN(originLng) 
            ? { lat: originLat, lng: originLng, name: originName, id: originId } 
            : null;
    
    const destination: Location | null = 
        !isNaN(destLat) && !isNaN(destLng) 
            ? { lat: destLat, lng: destLng, name: destName, id: destId } 
            : null;

    const handleOriginSelect = (location: Location) => {
        const params = new URLSearchParams(searchParams);
        params.set("fromLat", location.lat.toString());
        params.set("fromLng", location.lng.toString());
        params.set("fromName", location.name || "");
        if (location.id) {
            params.set("fromId", location.id);
        } else {
            params.delete("fromId");
        }
        setSearchParams(params);
        setOriginValue(location.name || "");
    };

    const handleDestSelect = (location: Location) => {
        const params = new URLSearchParams(searchParams);
        params.set("toLat", location.lat.toString());
        params.set("toLng", location.lng.toString());
        params.set("toName", location.name || "");
        if (location.id) {
            params.set("toId", location.id);
        } else {
            params.delete("toId");
        }
        setSearchParams(params);
        setDestValue(location.name || "");
    };
    
    const handleDepartureDateChange = (date: string) => {
        setDepartureDate(date);
        const params = new URLSearchParams(searchParams);
        params.set("departureDate", date);
        setSearchParams(params);
    };
    
    const handleDepartureTimeChange = (time: string) => {
        setDepartureTime(time);
        const params = new URLSearchParams(searchParams);
        params.set("departureTime", time);
        setSearchParams(params);
    };

    const departureDateTime = departureDate && departureTime 
        ? new Date(`${departureDate}T${departureTime}`)
        : undefined;

    const { data, isLoading, error } = useQuery<PlanResponse>({
        queryKey: ['route-search', origin, destination, departureDate, departureTime],
        queryFn: () => {
            if (!origin || !destination) {
                throw new Error('Origin and destination are required');
            }
            return searchRoutes(origin, destination, departureDateTime);
        },
        enabled: !!origin && !!destination,
        retry: 1,
    });

    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    if (!origin || !destination) {
        return (
            <main className="container mx-auto px-8 py-20">
                <TransitionWrapper>
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Invalid search parameters</p>
                        <Button.Root onClick={() => navigate("/")}>
                            <Button.Text>Go Back Home</Button.Text>
                        </Button.Root>
                    </div>
                </TransitionWrapper>
            </main>
        );
    }

    return (
        <main className="container mx-auto px-8 py-20">
            <TransitionWrapper>
                <button 
                    className="flex items-center text-sm mb-8" 
                    onClick={() => navigate("/")}
                >
                    <LucideArrowLeftFromLine className="w-5 h-5 text-white mr-4" />
                    Back to Search
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold mb-4">Search</h1>
                    <div className="bg-dark-900 px-5 py-5 rounded-md border border-dark-800">
                        <div className="relative rounded-md border border-dark-800">
                            <div className="border-b border-b-dark-800">
                                <LocationAutocomplete
                                    value={originValue}
                                    onChange={setOriginValue}
                                    onSelect={handleOriginSelect}
                                    placeholder="From"
                                    icon={<LucideCircleDot className="w-4 h-4" />}
                                    loading={isLoading}
                                />
                            </div>
                            <div>
                                <LocationAutocomplete
                                    value={destValue}
                                    onChange={setDestValue}
                                    onSelect={handleDestSelect}
                                    placeholder="To"
                                    icon={<LucideMapPin className="w-4 h-4" />}
                                    loading={isLoading}
                                />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-dark-800">
                            <div className="flex items-center gap-2 mb-2">
                                <LucideCalendar className="w-4 h-4 text-steel-blue-300" />
                                <label className="text-sm text-gray-400">Departure Time</label>
                            </div>
                            <div className="gap-3 grid grid-cols-2">
                                <div className="flex">
                                    <input
                                        type="date"
                                        value={departureDate}
                                        onChange={(e) => handleDepartureDateChange(e.target.value)}
                                        className="w-full bg-dark-800 border border-dark-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-steel-blue-500 focus:border-transparent"
                                        min={getDefaultDate()}
                                    />
                                </div>
                                <div className="flex">
                                    <input
                                        type="time"
                                        value={departureTime}
                                        onChange={(e) => handleDepartureTimeChange(e.target.value)}
                                        className="w-full bg-dark-800 border border-dark-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-steel-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <LucideLoader2 className="w-8 h-8 animate-spin text-steel-blue-300" />
                        <span className="ml-4">Searching for routes...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/20 border border-red-800 rounded-md p-4 mb-6">
                        <p className="text-red-500">
                            Error: {error instanceof Error ? error.message : 'Failed to search routes'}
                        </p>
                    </div>
                )}

                {data && data.itineraries && data.itineraries.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                            We've found {data.itineraries.length} route(s) for your journey.
                        </p>
                        {data.itineraries.map((itinerary, idx) => (
                            <Link
                                key={idx}
                                to={`/route/${idx}?${searchParams.toString()}`}
                                className="block"
                            >
                                <div className="bg-dark-900 border border-dark-800 rounded-md p-6 hover:border-steel-blue-500 transition-colors cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <LucideClock className="w-4 h-4 text-steel-blue-300" />
                                                    <span className="text-sm text-gray-400">
                                                        {formatTime(itinerary.startTime)} - {formatTime(itinerary.endTime)}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-steel-blue-300">
                                                    {formatDuration(itinerary.duration)}
                                                </span>
                                                {itinerary.transfers !== undefined && (
                                                    <span className="text-sm text-gray-400">
                                                        {itinerary.transfers} transfer{itinerary.transfers !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            {itinerary.legs && itinerary.legs.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {itinerary.legs
                                                        .filter(leg => leg.mode && leg.mode !== 'WALK')
                                                        .slice(0, 5)
                                                        .map((leg, legIdx) => (
                                                            <div 
                                                                key={legIdx}
                                                                className="flex items-center gap-1 px-2 py-1 bg-dark-800 rounded text-xs"
                                                            >
                                                                <LucideTrain className="w-3 h-3" />
                                                                <span>{leg.mode}</span>
                                                                {leg.routeShortName && (
                                                                    <span className="text-steel-blue-300">
                                                                        {leg.routeShortName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    {itinerary.legs.filter(leg => leg.mode === 'WALK').length > 0 && (
                                                        <span className="text-xs text-gray-500 px-2 py-1">
                                                            + {itinerary.legs.filter(leg => leg.mode === 'WALK').length} walk{itinerary.legs.filter(leg => leg.mode === 'WALK').length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {data && data.itineraries && data.itineraries.length === 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-800 rounded-md p-6 text-center">
                        <p className="text-yellow-500">No routes found. Please try different locations.</p>
                    </div>
                )}
            </TransitionWrapper>
        </main>
    );
}

