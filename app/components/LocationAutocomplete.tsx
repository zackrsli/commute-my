import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { geocodeLocation, type Match } from "~/lib/motis";
import { lines, type Station, getLineByStation } from "~/lib/line";
import { getLineIconUrl, getLineColor } from "~/lib/rapidklIcons";
import { LucideMapPin, LucideTrain, LucideLoader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: { lat: number; lng: number; name: string; id?: string }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

function findMatchingStation(match: Match): Station | null {
  const allStations = lines.flatMap(line => line.stations);
  
  const threshold = 0.001;
  let station = allStations.find(
    s => 
      Math.abs(s.lat - match.lat) < threshold &&
      Math.abs(s.lng - match.lon) < threshold
  );
  
  if (station) return station;
  
  station = allStations.find(
    s => s.name.toLowerCase() === match.name.toLowerCase()
  );
  
  return station || null;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
  className,
  loading = false,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  const { data: rawSuggestions = [], isLoading } = useQuery<Match[]>({
    queryKey: ["geocode", debouncedValue],
    queryFn: () => geocodeLocation(debouncedValue),
    enabled: debouncedValue.length >= 2 && isOpen && !loading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const suggestions = (() => {
    const stationMap = new Map<string, Match>();
    const nonStationMatches: Match[] = [];
    
    for (const match of rawSuggestions) {
      const station = findMatchingStation(match);
      if (station) {
        const existing = stationMap.get(station.id);
        if (!existing || (match.type === "STOP" && existing.type !== "STOP")) {
          stationMap.set(station.id, match);
        }
      } else {
        nonStationMatches.push(match);
      }
    }
    
    const deduplicated = [...stationMap.values(), ...nonStationMatches];
    
    return deduplicated.sort((a, b) => {
      const aIsStation = findMatchingStation(a) !== null;
      const bIsStation = findMatchingStation(b) !== null;
      const aIsTransitStop = a.type === "STOP";
      const bIsTransitStop = b.type === "STOP";
      
      if (aIsStation && bIsStation) {
        if (aIsTransitStop && !bIsTransitStop) return -1;
        if (!aIsTransitStop && bIsTransitStop) return 1;
        return 0;
      }
      if (aIsStation && !bIsStation) return -1;
      if (!aIsStation && bIsStation) return 1;
      
      if (aIsTransitStop && bIsTransitStop) return 0;
      if (aIsTransitStop && !bIsTransitStop) return -1;
      if (!aIsTransitStop && bIsTransitStop) return 1;
      
      return 0;
    });
  })();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  const handleSelect = (match: Match) => {
    onChange(match.name);
    const station = findMatchingStation(match);
    onSelect({
      lat: match.lat,
      lng: match.lon,
      name: match.name,
      id: station?.id,
    });
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelect(suggestions[focusedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (value.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative flex flex-row gap-4 items-center">
        {(icon || loading) && (
          <div className="absolute left-0 ml-6 text-steel-blue-200">
            {loading === false && isLoading === true ? (
              <LucideLoader2 className="w-4 h-4 animate-spin" />
            ) : (
              icon
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className={twMerge(
            "pl-16 py-3.5 pr-4 w-full placeholder:text-sm bg-dark-900 text-white border-0 focus:outline-none",
            loading && "opacity-50 cursor-not-allowed",
            className
          )}
          placeholder={placeholder}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-dark-900 border border-dark-800 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((match, index) => {
            const station = findMatchingStation(match);
            const line = station ? getLineByStation(station.id) : null;
            const isFocused = index === focusedIndex;
            
            return (
              <button
                key={match.id}
                type="button"
                onClick={() => handleSelect(match)}
                className={twMerge(
                  "w-full text-left px-6 py-3 flex items-center gap-6 hover:bg-dark-800 transition-colors",
                  isFocused && "bg-dark-800"
                )}
              >
                <div className="flex-shrink-0 flex items-center h-6">
                  {station && line ? (
                    <div 
                      className="w-4 h-4 flex items-center justify-center"
                      style={{ backgroundColor: getLineColor(line.id) }}
                    >
                      <img 
                        src={getLineIconUrl(line.id)} 
                        alt={`${line.name} Line`}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  ) : station ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <LucideTrain className="w-4 h-4 text-steel-blue-300" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <LucideMapPin className="w-4 h-4 text-steel-blue-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate flex items-center gap-2">
                    <span className="truncate">{match.name}</span>
                    {station && line && (
                      <span 
                        className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                        style={{ backgroundColor: getLineColor(line.id) }}
                      >
                        {station.id}
                      </span>
                    )}
                  </div>
                  {station && line && (
                    <div className="text-xs text-steel-blue-300 mt-0.5">
                      {line.type} {line.name}
                    </div>
                  )}
                  {station && !line && (
                    <div className="text-xs text-steel-blue-300 mt-0.5">
                      {lines
                        .find((l) => l.stations.some((s) => s.id === station.id))
                        ?.type || ""}{" "}
                      {lines
                        .find((l) => l.stations.some((s) => s.id === station.id))
                        ?.name || ""}
                    </div>
                  )}
                  {match.areas && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {match.areas.map((area) => area.name).reverse().join(", ")}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

