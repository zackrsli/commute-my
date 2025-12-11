import type { Route } from "./+types/home";
import { getLineById, getLineByStation, getStation } from "~/lib/line";
import { Link, useParams } from "react-router";
import { ShoppingBag, Building, TreesIcon as Tree, ArrowLeftFromLine, MapPin, Clock, MoonStar } from "lucide-react";
import { useNavigate } from "react-router";
import { TransitionWrapper } from "~/components/TransitionWrapper";
import { getLineIconUrl, getLineColor, RAPIDKL_STATION_ICONS } from "~/lib/rapidklIcons";

const icons = {
    mall: ShoppingBag,
    park: Tree,
    default: Building,
};

function getMosqueGoogleMapsUrl(name: string, lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
}

function getNearbyIcon(place: string): React.ElementType {
    if (place.toLowerCase().includes('mall') || place.toLowerCase().includes('shopping')) return icons.mall;
    if (place.toLowerCase().includes('park') || place.toLowerCase().includes('nature')) return icons.park;
    
    return icons.default;
}

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Commute" },
        { description: "A project aims to make public transportation in the Klang Valley more accessible to everyone, including tourists." },
        { property: "og:title", content: "Commute" },  
        { property: "og:description", content: "A project aims to make public transportation in the Klang Valley more accessible to everyone, including tourists." },
    ];
}

export default function Line() {
    let { id } = useParams();
    const line = getLineById(id!);  
    const navigate = useNavigate();  

    return (
        <main className="container mx-auto px-8 py-20">
            <TransitionWrapper key={`line-${id}`}>
                <button className="flex items-center text-sm" onClick={() => navigate(-1)}>
                    <ArrowLeftFromLine className="w-5 h-5 text-white mr-4" />
                    Back
                </button>
                {line ? (
                    <div className="flex flex-col mt-8">
                        {line.stations.map((station, index) => (
                            <div id={station.id} key={station.id} className="flex space-x-4">
                                <div className="flex flex-col items-center">
                                    <div 
                                        className="flex items-center justify-center gap-2 px-2 py-1 rounded"
                                        style={{ backgroundColor: getLineColor(line.id) }}
                                    >
                                        <img 
                                            src={getLineIconUrl(line.id)} 
                                            alt={`${line.name} Line`}
                                            className="w-5 h-5 object-contain"
                                        />
                                        <span 
                                            className="text-sm font-mono font-semibold text-white"
                                        >
                                            {station.id}
                                        </span>
                                    </div>
                                    {index < line.stations.length - 1 && (
                                        <div 
                                            className="w-1 flex-1 flex justify-center"
                                            style={{ 
                                                backgroundColor: getLineColor(line.id),
                                                minHeight: '24px',
                                                marginTop: '2px'
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            {station.name}
                                        </h3>
                                    </div>
                                    <div className="mt-2 space-y-4">
                                        {station.nearby && (
                                            <div className="space-y-2">
                                                <h3 className="flex items-center text-sm font-medium text-gray-300">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    Nearby Highlights
                                                </h3>
                                                <div className="grid md:grid-cols-4 gap-2 md:gap-4 mt-2">
                                                    {station.nearby.map((place, ix) => {
                                                        const Icon = getNearbyIcon(place);

                                                        return (
                                                            <div key={ix} className={`flex items-center space-x-2 bg-dark-800 px-4 py-2 rounded-lg w-full min-w-0`}>
                                                                <Icon className="w-4 h-4 flex-shrink-0 text-white" />
                                                                <span className="text-sm truncate min-w-0 text-white">{place}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {station.mosques && (
                                            <div className="space-y-2">
                                                <h3 className="flex items-center text-sm font-medium text-gray-300">
                                                    <MoonStar className="w-4 h-4 mr-2" />
                                                    Nearby Mosques
                                                </h3>
                                                <div className="grid md:grid-cols-4 gap-2 md:gap-4 mt-2">
                                                    {station.mosques.map((mosque, ix) => (
                                                        <a 
                                                            key={ix} 
                                                            href={getMosqueGoogleMapsUrl(mosque.name, mosque.lat, mosque.lng)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-dark-800 px-4 py-3 rounded-lg space-y-2 hover:bg-dark-700 transition-colors"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <MapPin className="w-4 h-4 flex-shrink-0 text-white" />
                                                                <span className="text-sm font-medium text-white">{mosque.name}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-gray-400">
                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                <span className="text-xs">{mosque.distance}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-gray-400">
                                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                                <span className="text-xs">{mosque.walkingTime}</span>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {station.interchangeStations && (
                                            <div className="space-y-2">
                                                <h3 className="flex items-center text-sm font-medium text-gray-300">
                                                    <img 
                                                        src={RAPIDKL_STATION_ICONS.interchange} 
                                                        alt="Interchange"
                                                        className="w-4 h-4 mr-2 object-contain"
                                                    />
                                                    Interchange Stations
                                                </h3>
                                                <div className="grid md:grid-cols-4 gap-2 md:gap-4 mt-2">
                                                    {station.interchangeStations.map((intStationId) => {
                                                        const intStation = getStation(intStationId);
                                                        const intLine = getLineByStation(intStationId);

                                                        return intStation && intLine && (
                                                            <Link 
                                                                to={`/line/${intLine.id}#${intStation.id}`} 
                                                                key={intStation.id} 
                                                                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:opacity-80 duration-300 ease-in-out transition-opacity"
                                                                style={{ backgroundColor: getLineColor(intLine.id) }}
                                                            >
                                                                <img 
                                                                    src={getLineIconUrl(intLine.id)} 
                                                                    alt={`${intLine.name} Line`}
                                                                    className="w-4 h-4 object-contain"
                                                                />
                                                                <span className="text-sm text-white font-medium">{intLine.type} {intStation.name} {intStation.id}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {station.connectingStations && (
                                            <div className="space-y-2">
                                                <h3 className="flex items-center text-sm font-medium text-gray-300">
                                                    <img 
                                                        src={RAPIDKL_STATION_ICONS.connecting} 
                                                        alt="Connecting"
                                                        className="w-4 h-4 mr-2 object-contain"
                                                    />
                                                    Connecting Stations
                                                </h3>
                                                <div className="grid md:grid-cols-4 gap-2 md:gap-4 mt-2">
                                                    {station.connectingStations.map((connStationId) => {
                                                        const connStation = getStation(connStationId);
                                                        const connLine = getLineByStation(connStationId);

                                                        return connStation && connLine && (
                                                            <Link 
                                                                to={`/line/${connLine.id}#${connStation.id}`} 
                                                                key={connStation.id} 
                                                                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:opacity-80 duration-300 ease-in-out transition-opacity"
                                                                style={{ backgroundColor: getLineColor(connLine.id) }}
                                                            >
                                                                <img 
                                                                    src={getLineIconUrl(connLine.id)} 
                                                                    alt={`${connLine.name} Line`}
                                                                    className="w-4 h-4 object-contain"
                                                                />
                                                                <span className="text-sm text-white font-medium">{connLine.type} {connStation.name} {connStation.id}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ): (
                    <p>Line not found.</p>
                )}
            </TransitionWrapper>
        </main>
    );
}
