import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router";
import { TransitionWrapper } from "~/components/TransitionWrapper";
import type { Route } from "./+types/route.$index";
import { searchRoutes, type Location, type PlanResponse } from "~/lib/motis";
import { LucideArrowLeftFromLine, LucideClock, LucideMapPin, LucideFootprints, LucideArrowRight, LucideTrain, LucideChevronRight, LucideChevronsRight, LucideArrowRightLeft, LucideChevronDown, LucideBus } from "lucide-react";
import { useParams } from "react-router";
import { getLineIconUrl, getLineColor } from "~/lib/rapidklIcons";
import { lines, type Station, getLineByStation } from "~/lib/line";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Route Details" },
    ];
}

function extractStationIdFromStopId(stopId: string | undefined): string | null {
    if (!stopId) return null;
    const parts = stopId.split('_');
    if (parts.length > 1) {
        return parts[parts.length - 1];
    }
    return null;
}

function findStationByLocation(
    lat: number | undefined, 
    lon: number | undefined, 
    name: string | undefined,
    stopId: string | undefined
): Station | null {
    const allStations = lines.flatMap(line => line.stations);
    
    if (stopId) {
        const stationId = extractStationIdFromStopId(stopId);
        if (stationId) {
            const station = allStations.find(s => s.id === stationId);
            if (station) return station;
        }
    }
    
    if (lat && lon) {
        const threshold = 0.001;
        let station = allStations.find(
            s => 
                Math.abs(s.lat - lat) < threshold &&
                Math.abs(s.lng - lon) < threshold
        );
        
        if (station) return station;
    }
    
    if (name) {
        const station = allStations.find(
            s => s.name.toLowerCase() === name.toLowerCase()
        );
        if (station) return station;
    }
    
    return null;
}

export default function RouteDetail() {
    const { index } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [expandedStops, setExpandedStops] = useState<Set<number>>(new Set());
    
    const routeIndex = parseInt(index || "0", 10);
    
    const originLat = parseFloat(searchParams.get("fromLat") || "");
    const originLng = parseFloat(searchParams.get("fromLng") || "");
    const originName = searchParams.get("fromName") || "";
    const destLat = parseFloat(searchParams.get("toLat") || "");
    const destLng = parseFloat(searchParams.get("toLng") || "");
    const destName = searchParams.get("toName") || "";

    const origin: Location | null = 
        !isNaN(originLat) && !isNaN(originLng) 
            ? { lat: originLat, lng: originLng, name: originName } 
            : null;
    
    const destination: Location | null = 
        !isNaN(destLat) && !isNaN(destLng) 
            ? { lat: destLat, lng: destLng, name: destName } 
            : null;

    const { data, isLoading, error } = useQuery<PlanResponse>({
        queryKey: ['route-search', origin, destination],
        queryFn: () => {
            if (!origin || !destination) {
                throw new Error('Origin and destination are required');
            }
            return searchRoutes(origin, destination);
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
                        <p className="text-red-500 mb-4">Invalid route parameters</p>
                        <button onClick={() => navigate("/")} className="text-steel-blue-300">
                            Go Back Home
                        </button>
                    </div>
                </TransitionWrapper>
            </main>
        );
    }

    if (isLoading) {
        return (
            <main className="container mx-auto px-8 py-20">
                <TransitionWrapper>
                    <div className="flex items-center justify-center py-12">
                        <span>Loading route details...</span>
                    </div>
                </TransitionWrapper>
            </main>
        );
    }

    if (error || !data || !data.itineraries || routeIndex >= data.itineraries.length) {
        return (
            <main className="container mx-auto px-8 py-20">
                <TransitionWrapper>
                    <div className="text-center">
                        <p className="text-red-500 mb-4">
                            {error ? (error instanceof Error ? error.message : 'Failed to load route') : 'Route not found'}
                        </p>
                        <button onClick={() => navigate(-1)} className="text-steel-blue-300">
                            Go Back
                        </button>
                    </div>
                </TransitionWrapper>
            </main>
        );
    }

    const itinerary = data.itineraries[routeIndex];



    return (
        <main className="container mx-auto px-8 py-20">
            <TransitionWrapper>
                <button 
                    className="flex items-center text-sm mb-8" 
                    onClick={() => navigate(-1)}
                >
                    <LucideArrowLeftFromLine className="w-5 h-5 text-white mr-4" />
                    Back to Results
                </button>

                <div className="mb-8">
                    <h1 className="text-2xl font-semibold mb-4">Route Details</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                            <LucideMapPin className="w-4 h-4" />
                            <span>{originName || `${origin.lat}, ${origin.lng}`}</span>
                        </div>
                        <LucideArrowRight className="w-4 h-4" />
                        <div className="flex items-center gap-2">
                            <LucideMapPin className="w-4 h-4" />
                            <span>{destName || `${destination.lat}, ${destination.lng}`}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <LucideClock className="w-4 h-4 text-steel-blue-300" />
                            <span>{formatTime(itinerary.startTime)} - {formatTime(itinerary.endTime)}</span>
                        </div>
                        <span className="text-steel-blue-300">
                            {formatDuration(itinerary.duration)}
                        </span>
                        {itinerary.transfers !== undefined && (
                            <span className="text-gray-400">
                                {itinerary.transfers} transfer{itinerary.transfers !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col">
                    {(() => {
                        const allLegs = itinerary.legs || [];
                        const filteredLegs = allLegs.filter((leg, legIdx, allLegs) => {
                            if (leg.mode === 'WALK' && leg.from && leg.to) {
                                const fromStation = findStationByLocation(leg.from.lat, leg.from.lon, leg.from.name, leg.from.stopId);
                                const toStation = findStationByLocation(leg.to.lat, leg.to.lon, leg.to.name, leg.to.stopId);
                                
                                const nextLeg = allLegs[legIdx + 1];
                                const isInterchange = nextLeg && nextLeg.mode !== 'WALK' && nextLeg.routeShortName;
                                
                                if (isInterchange) {
                                    return true;
                                }
                                
                                if (legIdx === 0) {
                                    const coordinateThreshold = 0.001;
                                    
                                    const originStation = findStationByLocation(leg.from.lat, leg.from.lon, leg.from.name, leg.from.stopId);
                                    
                                    if (originStation) {
                                        const destinationStation = findStationByLocation(leg.to.lat, leg.to.lon, leg.to.name, leg.to.stopId);
                                        
                                        const originToStationLatDiff = Math.abs((leg.from.lat || 0) - originStation.lat);
                                        const originToStationLonDiff = Math.abs((leg.from.lon || 0) - originStation.lng);
                                        
                                        if (originToStationLatDiff < coordinateThreshold && originToStationLonDiff < coordinateThreshold) {
                                            if (destinationStation && destinationStation.id === originStation.id) {
                                                return false;
                                            }
                                            
                                            const latDiff = Math.abs((leg.from.lat || 0) - (leg.to.lat || 0));
                                            const lonDiff = Math.abs((leg.from.lon || 0) - (leg.to.lon || 0));
                                            
                                            if (latDiff < coordinateThreshold && lonDiff < coordinateThreshold) {
                                                return false;
                                            }
                                        }
                                    }
                                    
                                    if (nextLeg && nextLeg.from) {
                                        const latDiff = Math.abs((leg.to.lat || 0) - (nextLeg.from.lat || 0));
                                        const lonDiff = Math.abs((leg.to.lon || 0) - (nextLeg.from.lon || 0));
                                        
                                        if (latDiff < coordinateThreshold && lonDiff < coordinateThreshold) {
                                            return false;
                                        }
                                    }
                                }
                                
                                const latDiff = Math.abs((leg.from.lat || 0) - (leg.to.lat || 0));
                                const lonDiff = Math.abs((leg.from.lon || 0) - (leg.to.lon || 0));
                                const distanceThreshold = 0.001;
                                
                                const walkDuration = leg.duration || 0;
                                const isSameStation = fromStation && toStation && fromStation.id === toStation.id;
                                const isVeryClose = latDiff < distanceThreshold && lonDiff < distanceThreshold;
                                const isVeryShortWalk = walkDuration < 180;
                                
                                if ((isSameStation && isVeryShortWalk) || (isVeryClose && isVeryShortWalk)) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        
                        const lastOriginalLeg = allLegs[allLegs.length - 1];
                        const lastFilteredLeg = filteredLegs[filteredLegs.length - 1];
                        const lastLegWasFiltered = lastOriginalLeg && 
                            lastOriginalLeg.mode === 'WALK' && 
                            (!lastFilteredLeg || lastFilteredLeg !== lastOriginalLeg);
                        
                        return (
                            <>
                                {filteredLegs.map((leg, idx) => {
                        const isWalking = leg.mode === 'WALK';
                        const isBus = leg.mode === 'BUS';
                        const prevLeg = idx > 0 ? filteredLegs[idx - 1] : null;
                        const nextLeg = idx < filteredLegs.length - 1 ? filteredLegs[idx + 1] : null;
                        
                        const isSameStationAsNext = nextLeg && 
                            leg.to && 
                            nextLeg.from &&
                            Math.abs((leg.to.lat || 0) - (nextLeg.from.lat || 0)) < 0.001 &&
                            Math.abs((leg.to.lon || 0) - (nextLeg.from.lon || 0)) < 0.001;
                        
                        const prevLegToMatchesThisFrom = prevLeg && 
                            leg.from && 
                            prevLeg.to &&
                            Math.abs((leg.from.lat || 0) - (prevLeg.to.lat || 0)) < 0.001 &&
                            Math.abs((leg.from.lon || 0) - (prevLeg.to.lon || 0)) < 0.001;
                        
                        const prevLegToWasHidden = prevLegToMatchesThisFrom && 
                            nextLeg && 
                            nextLeg.from &&
                            Math.abs((prevLeg.to.lat || 0) - (nextLeg.from.lat || 0)) < 0.001 &&
                            Math.abs((prevLeg.to.lon || 0) - (nextLeg.from.lon || 0)) < 0.001;
                        
                        const isSameStationAsPrev = prevLegToMatchesThisFrom && !prevLegToWasHidden;
                        
                        const isWalkingInterchange = isWalking && 
                            prevLeg !== null && 
                            nextLeg !== null &&
                            prevLeg.mode !== 'WALK' && 
                            nextLeg.mode !== 'WALK' &&
                            prevLeg.routeShortName && 
                            nextLeg.routeShortName &&
                            prevLeg.routeShortName !== nextLeg.routeShortName;
                        
                        const isTransitInterchange = !isWalking && 
                            prevLeg !== null && 
                            prevLeg.mode !== 'WALK' && 
                            leg.mode !== 'WALK' && 
                            prevLeg.routeShortName && 
                            leg.routeShortName &&
                            prevLeg.routeShortName !== leg.routeShortName;
                        
                        const isInterchange = isWalkingInterchange || isTransitInterchange;
                        
                        let nextLineColor = '#6B7280';
                        if (isWalkingInterchange && nextLeg) {
                            const nextRouteShortName = nextLeg.routeShortName?.toUpperCase() || '';
                            if (nextRouteShortName.includes('AG') || nextRouteShortName.includes('AMPANG')) {
                                nextLineColor = getLineColor('AG');
                            } else if (nextRouteShortName.includes('SP') || nextRouteShortName.includes('SRI PETALING')) {
                                nextLineColor = getLineColor('SP');
                            } else if (nextRouteShortName.includes('KJ') || nextRouteShortName.includes('KELANA')) {
                                nextLineColor = getLineColor('KJ');
                            } else if (nextRouteShortName.includes('MR') || nextRouteShortName.includes('MONORAIL')) {
                                nextLineColor = getLineColor('MR');
                            } else if (nextRouteShortName.includes('KG') || nextRouteShortName.includes('KAJANG')) {
                                nextLineColor = getLineColor('KG');
                            } else if (nextRouteShortName.includes('PY') || nextRouteShortName.includes('PUTRAJAYA')) {
                                nextLineColor = getLineColor('PY');
                            }
                        }
                        
                        const routeShortNameForIcon = isWalkingInterchange && prevLeg?.routeShortName
                            ? prevLeg.routeShortName.toUpperCase()
                            : leg.routeShortName?.toUpperCase() || '';
                        
                        let lineIconUrl: string | null = null;
                        let lineColor = isWalking ? '#6B7280' : isBus ? '#10b981' : '#5995d8';
                        
                        if (isWalking) {
                            // For walking interchanges, use prevLeg.to.stopId since that's the station being displayed
                            // For regular walking, use leg.to or leg.from
                            const transitStationStopId = isWalkingInterchange && prevLeg?.to?.stopId
                                ? prevLeg.to.stopId
                                : leg.to?.stopId || leg.from?.stopId;
                            if (transitStationStopId) {
                                const stationIdFromStopId = extractStationIdFromStopId(transitStationStopId);
                                if (stationIdFromStopId) {
                                    const linePrefix = stationIdFromStopId.match(/^([A-Z]+)/)?.[1];
                                    if (linePrefix && ['AG', 'SP', 'KJ', 'MR', 'KG', 'PY'].includes(linePrefix)) {
                                        lineIconUrl = getLineIconUrl(linePrefix);
                                        lineColor = getLineColor(linePrefix);
                                    }
                                }
                            }
                        }
                        
                        if (!lineIconUrl) {
                            if (routeShortNameForIcon.includes('AG') || routeShortNameForIcon.includes('AMPANG')) {
                                lineIconUrl = getLineIconUrl('AG');
                                lineColor = getLineColor('AG');
                            } else if (routeShortNameForIcon.includes('SP') || routeShortNameForIcon.includes('SRI PETALING')) {
                                lineIconUrl = getLineIconUrl('SP');
                                lineColor = getLineColor('SP');
                            } else if (routeShortNameForIcon.includes('KJ') || routeShortNameForIcon.includes('KELANA')) {
                                lineIconUrl = getLineIconUrl('KJ');
                                lineColor = getLineColor('KJ');
                            } else if (routeShortNameForIcon.includes('MR') || routeShortNameForIcon.includes('MONORAIL')) {
                                lineIconUrl = getLineIconUrl('MR');
                                lineColor = getLineColor('MR');
                            } else if (routeShortNameForIcon.includes('KG') || routeShortNameForIcon.includes('KAJANG')) {
                                lineIconUrl = getLineIconUrl('KG');
                                lineColor = getLineColor('KG');
                            } else if (routeShortNameForIcon.includes('PY') || routeShortNameForIcon.includes('PUTRAJAYA')) {
                                lineIconUrl = getLineIconUrl('PY');
                                lineColor = getLineColor('PY');
                            }
                        }
                        
                        return (
                            <div key={idx} className="flex space-x-4">
                                <div className="flex flex-col items-center">
                                    <div 
                                        className="w-8 h-8 flex items-center justify-center rounded"
                                        style={{ backgroundColor: lineColor }}
                                    >
                                        {lineIconUrl ? (
                                            <img 
                                                src={lineIconUrl} 
                                                alt={`${leg.mode || 'Transit'} Line`}
                                                className="w-5 h-5 object-contain"
                                            />
                                        ) : isWalking ? (
                                            <LucideFootprints className="w-5 h-5 text-white" />
                                        ) : isBus ? (
                                            <LucideBus className="w-5 h-5 text-white" />
                                        ) : (
                                            <div className="w-5 h-5 bg-white rounded" />
                                        )}
                                    </div>
                                    {(() => {
                                        const isLastLeg = idx === filteredLegs.length - 1;
                                        const lastLegTo = isLastLeg ? leg.to : null;
                                        const lastLegMatchesDestination = isLastLeg && destination && lastLegTo &&
                                            Math.abs((lastLegTo.lat || 0) - destination.lat) < 0.001 &&
                                            Math.abs((lastLegTo.lon || 0) - destination.lng) < 0.001;
                                        const willShowFinalDestination = destination && (
                                            lastLegWasFiltered || 
                                            !lastLegTo || 
                                            lastLegMatchesDestination || 
                                            Math.abs((lastLegTo.lat || 0) - destination.lat) > 0.001 ||
                                            Math.abs((lastLegTo.lon || 0) - destination.lng) > 0.001
                                        );
                                        
                                        return idx < filteredLegs.length - 1 || (isLastLeg && willShowFinalDestination);
                                    })() && (
                                        <div 
                                            className="w-1 flex-1 flex justify-center"
                                            style={{ 
                                                backgroundColor: lineColor,
                                                minHeight: '24px',
                                                marginTop: '2px'
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 pb-6">
                                    {(idx === 0 || isSameStationAsPrev || prevLegToWasHidden || isWalkingInterchange) && (
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                                                <span>{(isWalkingInterchange && prevLeg?.to?.name) ? prevLeg.to.name : (leg.from?.name || 'Unknown')}</span>
                                                {(() => {
                                                    const stationLocation = isWalkingInterchange && prevLeg?.to 
                                                        ? prevLeg.to 
                                                        : leg.from;
                                                    // For walking interchanges, use prevLeg's routeShortName since we're showing prevLeg.to station
                                                    const routeShortNameForStation = isWalkingInterchange && prevLeg?.routeShortName
                                                        ? prevLeg.routeShortName.toUpperCase()
                                                        : leg.routeShortName?.toUpperCase() || '';
                                                    
                                                    if (!stationLocation || (isWalking && !isWalkingInterchange && !stationLocation.stopId)) return null;
                                                    
                                                    const station = findStationByLocation(stationLocation.lat, stationLocation.lon, stationLocation.name, stationLocation.stopId);
                                                    if (!station) return null;
                                                    
                                                    let matchedLineId: string | null = null;
                                                    
                                                    // Always use the stationLocation's stopId to get the correct line
                                                    const stopIdToUse = stationLocation.stopId;
                                                    
                                                    if (stopIdToUse) {
                                                        const stationIdFromStopId = extractStationIdFromStopId(stopIdToUse);
                                                        if (stationIdFromStopId) {
                                                            const linePrefix = stationIdFromStopId.match(/^([A-Z]+)/)?.[1];
                                                            if (linePrefix && ['AG', 'SP', 'KJ', 'MR', 'KG', 'PY'].includes(linePrefix)) {
                                                                matchedLineId = linePrefix;
                                                            }
                                                        }
                                                    }
                                                    
                                                    if (!matchedLineId) {
                                                        if (routeShortNameForStation.includes('AG') || routeShortNameForStation.includes('AMPANG')) {
                                                            matchedLineId = 'AG';
                                                        } else if (routeShortNameForStation.includes('SP') || routeShortNameForStation.includes('SRI PETALING')) {
                                                            matchedLineId = 'SP';
                                                        } else if (routeShortNameForStation.includes('KJ') || routeShortNameForStation.includes('KELANA')) {
                                                            matchedLineId = 'KJ';
                                                        } else if (routeShortNameForStation.includes('MR') || routeShortNameForStation.includes('MONORAIL')) {
                                                            matchedLineId = 'MR';
                                                        } else if (routeShortNameForStation.includes('KG') || routeShortNameForStation.includes('KAJANG')) {
                                                            matchedLineId = 'KG';
                                                        } else if (routeShortNameForStation.includes('PY') || routeShortNameForStation.includes('PUTRAJAYA')) {
                                                            matchedLineId = 'PY';
                                                        }
                                                    }
                                                    
                                                    // Find the station ID that matches the line being used
                                                    const allStationIds = [station.id, ...(station.interchangeStations || [])];
                                                    const matchingStationId = matchedLineId 
                                                        ? allStationIds.find(id => {
                                                            const stationLine = getLineByStation(id);
                                                            return stationLine?.id === matchedLineId;
                                                        }) || station.id
                                                        : station.id;
                                                    
                                                    const stationLine = getLineByStation(matchingStationId);
                                                    if (!stationLine) return null;
                                                    
                                                    return (
                                                        <span 
                                                            className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                                            style={{ backgroundColor: getLineColor(stationLine.id) }}
                                                        >
                                                            {matchingStationId}
                                                        </span>
                                                    );
                                                })()}
                                                {!isWalking && leg.headsign && (
                                                    <span className="flex items-center gap-2 text-xs text-gray-400">
                                                        <LucideChevronsRight className="w-4 h-4" /> {leg.headsign}
                                                    </span>
                                                )}
                                            </h3>
                                        </div>
                                        {(() => {
                                            const timeToShow = isWalkingInterchange && prevLeg?.endTime 
                                                ? prevLeg.endTime 
                                                : leg.startTime;
                                            return timeToShow ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <LucideClock className="w-4 h-4" />
                                                    <span>{formatTime(timeToShow)}</span>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                    )}
                                    
                                    <div>
                                        {isWalking && (
                                            <div>
                                                {isWalkingInterchange && nextLeg ? (
                                                    <div className="px-3 py-2 rounded bg-steel-blue-900/30 border border-steel-blue-700/50">
                                                        <div className="flex items-center gap-2 text-sm text-steel-blue-300">
                                                            <LucideArrowRightLeft className="w-4 h-4" />
                                                            <div>
                                                            <span className="font-semibold">Interchange</span>
                                                            {(() => {
                                                                const nextRouteShortName = nextLeg.routeShortName?.toUpperCase() || '';
                                                                let lineName = nextLeg.to.name;
                                                                if (nextRouteShortName.includes('AG') || nextRouteShortName.includes('AMPANG')) {
                                                                    lineName = 'LRT Ampang';
                                                                } else if (nextRouteShortName.includes('SP') || nextRouteShortName.includes('SRI PETALING')) {
                                                                    lineName = 'LRT Sri Petaling';
                                                                } else if (nextRouteShortName.includes('KJ') || nextRouteShortName.includes('KELANA')) {
                                                                    lineName = 'LRT Kelana Jaya';
                                                                } else if (nextRouteShortName.includes('MR') || nextRouteShortName.includes('MONORAIL')) {
                                                                    lineName = 'KL Monorail';
                                                                } else if (nextRouteShortName.includes('KG') || nextRouteShortName.includes('KAJANG')) {
                                                                    lineName = 'MRT Kajang';
                                                                } else if (nextRouteShortName.includes('PY') || nextRouteShortName.includes('PUTRAJAYA')) {
                                                                    lineName = 'MRT Putrajaya';
                                                                }
                                                                return lineName ? <span>&nbsp;to {lineName}</span> : null;
                                                            })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <LucideFootprints className="w-4 h-4" />
                                                    <span>Walk {formatDuration(leg.duration || 0)}</span>
                                                </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {(() => {
                                        const isLastLeg = idx === filteredLegs.length - 1;
                                        const lastLegMatchesDestination = isLastLeg && destination && leg.to &&
                                            Math.abs((leg.to.lat || 0) - destination.lat) < 0.001 &&
                                            Math.abs((leg.to.lon || 0) - destination.lng) < 0.001;
                                        
                                        return !isSameStationAsNext && !lastLegMatchesDestination;
                                    })() && (
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                                                <span>{leg.to?.name || 'Unknown'}</span> 
                                                {leg.to && (() => {
                                                    const station = findStationByLocation(leg.to.lat, leg.to.lon, leg.to.name, leg.to.stopId);
                                                    if (!station) return null;
                                                    
                                                    const routeShortName = leg.routeShortName?.toUpperCase() || '';
                                                    let matchedLineId: string | null = null;
                                                    
                                                    if (leg.to.stopId) {
                                                        const stationIdFromStopId = extractStationIdFromStopId(leg.to.stopId);
                                                        if (stationIdFromStopId) {
                                                            const linePrefix = stationIdFromStopId.match(/^([A-Z]+)/)?.[1];
                                                            if (linePrefix && ['AG', 'SP', 'KJ', 'MR', 'KG', 'PY'].includes(linePrefix)) {
                                                                matchedLineId = linePrefix;
                                                            }
                                                        }
                                                    }
                                                    
                                                    if (!matchedLineId) {
                                                        if (routeShortName.includes('AG') || routeShortName.includes('AMPANG')) {
                                                            matchedLineId = 'AG';
                                                        } else if (routeShortName.includes('SP') || routeShortName.includes('SRI PETALING')) {
                                                            matchedLineId = 'SP';
                                                        } else if (routeShortName.includes('KJ') || routeShortName.includes('KELANA')) {
                                                            matchedLineId = 'KJ';
                                                        } else if (routeShortName.includes('MR') || routeShortName.includes('MONORAIL')) {
                                                            matchedLineId = 'MR';
                                                        } else if (routeShortName.includes('KG') || routeShortName.includes('KAJANG')) {
                                                            matchedLineId = 'KG';
                                                        } else if (routeShortName.includes('PY') || routeShortName.includes('PUTRAJAYA')) {
                                                            matchedLineId = 'PY';
                                                        }
                                                    }
                                                    
                                                    const allStationIds = [station.id, ...(station.interchangeStations || [])];
                                                    const matchingStationId = matchedLineId 
                                                        ? allStationIds.find(id => {
                                                            const stationLine = getLineByStation(id);
                                                            return stationLine?.id === matchedLineId;
                                                        }) || station.id
                                                        : station.id;
                                                    
                                                    const stationLine = getLineByStation(matchingStationId);
                                                    if (!stationLine) return null;
                                                    
                                                    return (
                                                        <span 
                                                            className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                                            style={{ backgroundColor: getLineColor(stationLine.id) }}
                                                        >
                                                            {matchingStationId}
                                                        </span>
                                                    );
                                                })()}
                                            </h3>
                                        </div>
                                        {leg.endTime && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <LucideClock className="w-4 h-4" />
                                                <span>{formatTime(leg.endTime)} {leg.duration && !isWalking && `(${formatDuration(leg.duration)})`}</span>
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    {leg.intermediateStops && leg.intermediateStops.length > 0 && (
                                        <div className="mt-4 pl-4 border-l-2 border-dark-700">
                                            <p className="text-xs text-gray-500 mb-2">
                                                {leg.intermediateStops.length} intermediate stop{leg.intermediateStops.length !== 1 ? 's' : ''}
                                            </p>
                                            {(expandedStops.has(idx) ? leg.intermediateStops : leg.intermediateStops.slice(0, 5)).map((stop, stopIdx) => (
                                                <div key={stopIdx} className="text-xs text-gray-400 mb-1">
                                                    • {stop.name}
                                                </div>
                                            ))}
                                            {leg.intermediateStops.length > 5 && (
                                                <button
                                                    onClick={() => {
                                                        const newExpanded = new Set(expandedStops);
                                                        if (newExpanded.has(idx)) {
                                                            newExpanded.delete(idx);
                                                        } else {
                                                            newExpanded.add(idx);
                                                        }
                                                        setExpandedStops(newExpanded);
                                                    }}
                                                    className="flex items-center gap-1 text-xs text-steel-blue-300 hover:text-steel-blue-200 transition-colors mt-1"
                                                >
                                                    {expandedStops.has(idx) ? (
                                                        <>
                                                            <LucideChevronDown className="w-3 h-3 rotate-180" />
                                                            Show less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <LucideChevronDown className="w-3 h-3" />
                                                            + {leg.intermediateStops.length - 5} more
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {(() => {
                        const lastLegTo = filteredLegs.length > 0 ? filteredLegs[filteredLegs.length - 1]?.to : null;
                        const lastLegMatchesDestination = lastLegTo && destination &&
                            Math.abs((lastLegTo.lat || 0) - destination.lat) < 0.001 &&
                            Math.abs((lastLegTo.lon || 0) - destination.lng) < 0.001;
                        const shouldShowFinalDestination = destination && (lastLegWasFiltered || !lastLegTo || lastLegMatchesDestination || 
                            Math.abs((lastLegTo.lat || 0) - destination.lat) > 0.001 ||
                            Math.abs((lastLegTo.lon || 0) - destination.lng) > 0.001);
                        
                        if (!shouldShowFinalDestination) return null;
                        
                        const finalDestName = destination.name || (lastLegWasFiltered && lastOriginalLeg?.to?.name) || (filteredLegs.length > 0 && filteredLegs[filteredLegs.length - 1]?.to?.name) || 'Unknown';
                        const finalDestLat = destination.lat ?? (lastLegWasFiltered ? lastOriginalLeg?.to?.lat : undefined) ?? (filteredLegs.length > 0 ? filteredLegs[filteredLegs.length - 1]?.to?.lat : undefined);
                        const finalDestLon = destination.lng ?? (lastLegWasFiltered ? lastOriginalLeg?.to?.lon : undefined) ?? (filteredLegs.length > 0 ? filteredLegs[filteredLegs.length - 1]?.to?.lon : undefined);
                        
                        const finalDestStation = findStationByLocation(finalDestLat, finalDestLon, finalDestName, undefined);
                        const finalDestStationLine = finalDestStation ? getLineByStation(finalDestStation.id) : null;
                        const finalDestLineIconUrl = finalDestStationLine ? getLineIconUrl(finalDestStationLine.id) : null;
                        const finalDestLineColor = finalDestStationLine ? getLineColor(finalDestStationLine.id) : '#60A5FA';
                        
                        return (
                            <div className="flex space-x-4">
                                <div className="flex flex-col items-center">
                                    <div 
                                        className="w-8 h-8 flex items-center justify-center rounded"
                                        style={{ backgroundColor: finalDestLineColor }}
                                    >
                                        {finalDestLineIconUrl ? (
                                            <img 
                                                src={finalDestLineIconUrl} 
                                                alt={`${finalDestStationLine?.name || 'Station'} Line`}
                                                className="w-5 h-5 object-contain"
                                            />
                                        ) : (
                                            <LucideMapPin className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                                                <span>{finalDestName}</span>
                                                {(() => {
                                                    if (!finalDestStation) return null;
                                                    const stationLine = getLineByStation(finalDestStation.id);
                                                    if (!stationLine) return null;
                                                    
                                                    return (
                                                        <span 
                                                            className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                                            style={{ backgroundColor: getLineColor(stationLine.id) }}
                                                        >
                                                            {finalDestStation.id}
                                                        </span>
                                                    );
                                                })()}
                                            </h3>
                                        </div>
                                        {itinerary.endTime && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <LucideClock className="w-4 h-4" />
                                                <span>{formatTime(itinerary.endTime)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    </>
                        );
                    })()}
                </div>
            </TransitionWrapper>
        </main>
    );
}

