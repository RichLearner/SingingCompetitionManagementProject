"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserPlus,
  UserX,
  Crown,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { assignParticipantToGroup } from "@/lib/actions/participants";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Participant {
  id: string;
  name: string;
  photo_url?: string | null;
  group_id: string | null;
  is_leader?: boolean;
}

interface GroupParticipantManagerProps {
  groupId: string;
  competitionId: string;
  locale: string;
}

export function GroupParticipantManager({
  groupId,
  competitionId,
  locale,
}: GroupParticipantManagerProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState<Participant[]>(
    []
  );
  const [availableParticipants, setAvailableParticipants] = useState<
    Participant[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] =
    useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current group participants and available participants
  useEffect(() => {
    console.log("GroupParticipantManager mounted with:", {
      groupId,
      competitionId,
    });
    fetchParticipants();
  }, [groupId]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "Fetching participants for group:",
        groupId,
        "competition:",
        competitionId
      );

      // Use fetch API to get data from server-side
      const [groupResponse, allResponse] = await Promise.all([
        fetch(`/api/participants?group_id=${groupId}`),
        fetch(`/api/participants?competition_id=${competitionId}`),
      ]);

      if (!groupResponse.ok || !allResponse.ok) {
        throw new Error("Failed to fetch participants");
      }

      const groupParticipants: Participant[] = await groupResponse.json();
      const allParticipants: Participant[] = await allResponse.json();

      console.log("All participants found:", allParticipants?.length || 0);
      console.log("Group participants:", groupParticipants?.length || 0);

      // Filter available participants (those not in this group)
      const available =
        allParticipants?.filter((p: Participant) => p.group_id !== groupId) ||
        [];

      console.log("Available participants:", available.length);
      console.log("Available participants:", available);

      setCurrentParticipants(groupParticipants || []);
      setAvailableParticipants(available);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setError("Failed to load participants");
    } finally {
      setIsLoading(false);
    }
  };

  const addParticipantToGroup = async (participantId?: string) => {
    const idToAdd = participantId || selectedParticipantId;
    if (!idToAdd) return;

    console.log("Adding participant", idToAdd, "to group", groupId);

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await assignParticipantToGroup(
        idToAdd,
        groupId,
        competitionId
      );

      if (result.success) {
        setSuccess("Participant added to group successfully");
        setSelectedParticipantId("");
        await fetchParticipants(); // Refresh the lists
      } else {
        setError("Failed to add participant to group");
      }
    } catch (error) {
      console.error("Error adding participant to group:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to add participant to group"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeParticipantFromGroup = async (participantId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await assignParticipantToGroup(
        participantId,
        null,
        competitionId
      );

      if (result.success) {
        setSuccess("Participant removed from group successfully");
        await fetchParticipants(); // Refresh the lists
      } else {
        setError("Failed to remove participant from group");
      }
    } catch (error) {
      console.error("Error removing participant from group:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove participant from group"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAvailableParticipants = availableParticipants.filter(
    (participant) =>
      participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Group Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t("group.currentMembers")} ({currentParticipants.length})
          </CardTitle>
          <CardDescription>
            {t("group.currentMembersDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t("common.loading")}</span>
            </div>
          ) : currentParticipants.length > 0 ? (
            <div className="space-y-3">
              {currentParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {participant.photo_url ? (
                        <img
                          src={participant.photo_url}
                          alt={participant.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{participant.name}</span>
                      {participant.is_leader && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {participant.is_leader && (
                      <Badge variant="outline" className="text-yellow-600">
                        {t("group.leader")}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        removeParticipantFromGroup(participant.id);
                      }}
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      {t("group.remove")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p>{t("group.noMembers")}</p>
              <p className="text-sm">{t("group.noMembersDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Add New Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            {t("group.addMembers")}
          </CardTitle>
          <CardDescription>{t("group.addMembersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Available Participants */}
          <div className="space-y-2">
            <Label htmlFor="search">{t("group.searchParticipants")}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder={t("group.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Available Participants List */}
          <div className="space-y-2">
            <Label>
              {t("group.availableParticipants")} (
              {filteredAvailableParticipants.length})
            </Label>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
              {filteredAvailableParticipants.length > 0 ? (
                filteredAvailableParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {participant.photo_url ? (
                          <img
                            src={participant.photo_url}
                            alt={participant.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <span className="text-sm">{participant.name}</span>
                      {participant.group_id && (
                        <Badge variant="secondary" className="text-xs">
                          {t("group.inOtherGroup")}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        addParticipantToGroup(participant.id);
                      }}
                      disabled={isLoading}
                    >
                      <UserPlus className="mr-2 h-3 w-3" />
                      {t("group.add")}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">
                    {searchTerm
                      ? t("group.noParticipantsFound")
                      : t("group.noAvailableParticipants")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="quick-add">{t("group.quickAdd")}</Label>
            <div className="flex space-x-2">
              <Select
                value={selectedParticipantId}
                onValueChange={setSelectedParticipantId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t("group.selectParticipant")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableParticipants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                      {participant.group_id && ` (${t("group.inOtherGroup")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  addParticipantToGroup();
                }}
                disabled={!selectedParticipantId || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {t("group.addToGroup")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
