"use client";

import { Check, Clipboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { campus } from "~/lib/new-util";
import { api } from "~/trpc/react";

export default function ClientLaundryRoom({
  roomKey,
  variant,
}: {
  roomKey: string;
  variant: "small" | "big";
}) {
  const [copiedPlate, setCopiedPlate] = useState<string | null>(null);
  useEffect(() => {
    if (!copiedPlate) return;
    const timer = setTimeout(() => setCopiedPlate(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedPlate]);

  const { data: machines, isLoading } = api.laundry.getFromAPI.useQuery(
    {
      key: roomKey,
    },
    { refetchInterval: 1000 * 60 },
  );

  const location = campus.getLocationForLaundryKey({ id: roomKey });

  if (!location) {
    return (
      <p className="text-red-500">
        Error: Unable to locate floor with laundry room ID {roomKey}.
      </p>
    );
  }

  if (isLoading) {
    return (
      <>
        <Link
          href={`#${location.floor.id.toString()}`}
          className={
            variant === "small" ? "text-lg font-bold" : "text-2xl font-bold"
          }
        >
          {variant === "small" ? "" : location.building.displayName}
          {variant === "small" ? "" : " "}
          {location.floor.displayName}
        </Link>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-28 w-80"></Skeleton>
          <Skeleton className="h-28 w-80"></Skeleton>
          <Skeleton className="h-28 w-80"></Skeleton>
          <Skeleton className="h-28 w-80"></Skeleton>
        </div>
      </>
    );
  }

  return (
    <section className="flex flex-col gap-4" id={location.floor.id.toString()}>
      <Link
        href={`#${location.floor.id.toString()}`}
        className={
          variant === "small" ? "text-lg font-bold" : "text-2xl font-bold"
        }
      >
        {variant === "small" ? "" : location.building.displayName}
        {variant === "small" ? "" : " "}
        {location.floor.displayName}
      </Link>
      <div className="flex flex-wrap gap-4">
        {(machines ?? [])
          .sort((a, b) => (a.type > b.type ? -1 : 1))
          .map((machine) => {
            return (
              <Card key={machine.identifier} className="w-80">
                <CardHeader>
                  <CardTitle>
                    <div className="flex flex-row items-center justify-between">
                      <span>
                        {machine.type.slice(0, 1).toUpperCase() +
                          machine.type.slice(1)}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              void navigator.clipboard.writeText(
                                machine.licensePlate,
                              );
                              setCopiedPlate(machine.licensePlate);
                            }}
                            className="bg-accent flex items-center gap-1 rounded-sm px-2 py-1 text-xs"
                          >
                            {copiedPlate === machine.licensePlate ? (
                              <Check className="text-accent-foreground size-3" />
                            ) : (
                              <Clipboard className="text-accent-foreground size-3" />
                            )}
                            <p className="font-light">{machine.licensePlate}</p>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {copiedPlate === machine.licensePlate
                              ? "Copied!"
                              : "Copy to clipboard"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardTitle>
                </CardHeader>
                {machine.status === "in-use" && (
                  <CardContent>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p className="text-sm">
                        {machine.timeRemaining === 1
                          ? `${machine.timeRemaining} minute`
                          : `${machine.timeRemaining} minutes`}
                      </p>
                      <Progress
                        className="w-full"
                        value={
                          ((machine.defaultTotalTime - machine.timeRemaining) /
                            machine.defaultTotalTime) *
                          100
                        }
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
      </div>
    </section>
  );
}
