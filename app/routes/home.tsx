import { useState } from "react";
import { TransitionWrapper } from "~/components/TransitionWrapper";
import type { Route } from "./+types/home";
import { lines } from "~/lib/line";
import { Link, useNavigate } from "react-router";
import { LucideArrowUpDown, LucideCircleDot, LucideMapPin } from "lucide-react";
import { Button } from "~/components/Button";
import { LocationAutocomplete } from "~/components/LocationAutocomplete";
import type { Location } from "~/lib/motis";
import { getLineIconUrl } from "~/lib/rapidklIcons";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Commute" },
        { description: "A project aims to make public transportation in the Klang Valley more accessible to everyone, including tourists." },
        { property: "og:title", content: "Commute" },  
        { property: "og:description", content: "A project aims to make public transportation in the Klang Valley more accessible to everyone, including tourists." },
    ];
}

export default function Home() {
    const navigate = useNavigate();
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [originCoords, setOriginCoords] = useState<Location | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<Location | null>(null);

    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
        const tempCoords = originCoords;
        setOriginCoords(destinationCoords);
        setDestinationCoords(tempCoords);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!originCoords) {
            alert('Please select an origin location');
            return;
        }
        
        if (!destinationCoords) {
            alert('Please select a destination location');
            return;
        }
        
        const params = new URLSearchParams({
            fromLat: originCoords.lat.toString(),
            fromLng: originCoords.lng.toString(),
            fromName: originCoords.name || '',
            toLat: destinationCoords.lat.toString(),
            toLng: destinationCoords.lng.toString(),
            toName: destinationCoords.name || '',
        });
        
        if (originCoords.id) {
            params.set('fromId', originCoords.id);
        }
        if (destinationCoords.id) {
            params.set('toId', destinationCoords.id);
        }
        
        navigate(`/search?${params.toString()}`);
    };

    return (
        <main className="container mx-auto p-6 min-h-screen flex flex-col justify-center">
            <TransitionWrapper>
                <div className="mb-8 text-center hidden md:block">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Commute
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Making Klang Valley public transport easier for everyone – locals & tourists alike.
                    </p>
                </div>
                <div className="bg-dark-900 px-5 py-5 rounded-md border border-dark-800 grid md:grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold text-lg mb-1">Plan Your Journey</p>
                        <p className="text-sm text-gray-400 mb-5">Find the best route across RapidKL lines.</p>
                        <form className="mt-5" onSubmit={handleSubmit}>
                            <div className="relative rounded-md border border-dark-800">
                                <div className="border-b border-b-dark-800">
                                    <LocationAutocomplete
                                        value={origin}
                                        onChange={(value) => {
                                            setOrigin(value);
                                        }}
                                        onSelect={(location) => {
                                            setOriginCoords(location);
                                            setOrigin(location.name);
                                        }}
                                        placeholder="Origin"
                                        icon={<LucideCircleDot className="w-4 h-4" />}
                                    />
                                </div>
                                <div>
                                    <LocationAutocomplete
                                        value={destination}
                                        onChange={(value) => {
                                            setDestination(value);
                                        }}
                                        onSelect={(location) => {
                                            setDestinationCoords(location);
                                            setDestination(location.name);
                                        }}
                                        placeholder="Destination"
                                        icon={<LucideMapPin className="w-4 h-4" />}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSwap}
                                    className="absolute top-[calc(50%-1.25rem)] right-4 p-3 rounded-full bg-steel-blue-200 hover:bg-steel-blue-300 transition-colors cursor-pointer"
                                    aria-label="Swap origin and destination"
                                >
                                    <LucideArrowUpDown className="w-3.5 h-3.5 text-steel-blue-800" />
                                </button>
                            </div>
                            <Button.Root className="mt-6 w-full" type="submit" disabled={!originCoords || !destinationCoords}>
                                <Button.Text>Search Route</Button.Text>
                            </Button.Root>
                            <p className="text-yellow-500 mt-2 text-xs">This feature is still in beta. Please report any issues you encounter in the <a href="https://github.com/zackrsli/commute-my/issues" target="_blank" rel="noopener noreferrer" className="text-steel-blue-300 hover:text-steel-blue-200 transition-colors">GitHub repository</a>.</p>
                        </form>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <p className="font-semibold text-lg mb-1 text-left">Or... Browse Lines</p>
                        <p className="text-sm text-gray-400 mb-5 text-left">View all RapidKL train lines and their stations.</p>
                        <div className="grid md:grid-cols-2 gap-3 mt-5">
                            {lines.map((line) => (
                                <Link key={line.id} to={`/line/${line.id}`}>
                                    <Button.Root className="w-full flex items-center justify-center px-4 py-3 min-h-[48px] relative" variant={line.color}>
                                        <img 
                                            src={getLineIconUrl(line.id)} 
                                            alt={`${line.name} Line`}
                                            className="w-5 h-5 object-contain absolute left-4"
                                        />
                                        <Button.Text>{line.type} {line.name}</Button.Text>
                                    </Button.Root>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-4 md:mt-8 text-center">
                    <p className="text-sm text-gray-400 italic flex items-center justify-center gap-2">
                        <span className="text-xl">🇲🇾</span>
                        <span>Built by Malaysian, for Malaysians</span>
                    </p>
                </div>
            </TransitionWrapper>
        </main>
    );
}
