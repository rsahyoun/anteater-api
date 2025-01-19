import DeleteKey from "@/components/key/DeleteKey";
import DisplayKey from "@/components/key/view/DisplayKey";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { KeyData } from "@packages/key-types";
import { GlobeIcon, LockIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import type { SetStateAction } from "react";

interface Props {
  apiKey: string;
  apiKeyData: KeyData;
  apiKeys: Record<string, KeyData>;
  setApiKeys: React.Dispatch<SetStateAction<Record<string, KeyData>>>;
}

const KeyTableRow: React.FC<Props> = ({ apiKey, apiKeyData, apiKeys, setApiKeys }) => {
  const abbreviatedKey = `...${apiKey.substring(apiKey.indexOf(".") + 1)}`;

  const createdAtFormat = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const keyTypeToIcon = (keyType: string) => {
    const className = "size-4";

    let icon: React.ReactElement | null;

    switch (keyType) {
      case "publishable":
        icon = <GlobeIcon className={className} />;
        break;
      case "secret":
        icon = <LockIcon className={className} />;
        break;
      default:
        icon = null;
    }

    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger>{icon}</TooltipTrigger>
          <TooltipContent>
            <p>{keyType} key</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <TableRow>
      <TableCell className={"max-w-0 overflow-x-hidden"}>
        <span className={"flex items-center space-x-2"}>
          {keyTypeToIcon(apiKeyData._type)}
          <span>{apiKeyData.name}</span>
        </span>
      </TableCell>
      <TableCell>{createdAtFormat.format(new Date(apiKeyData.createdAt))}</TableCell>
      <TableCell>
        <DisplayKey keyText={abbreviatedKey} copyText={apiKey} />
      </TableCell>
      <TableCell>
        <span className={"flex justify-end space-x-4"}>
          <Button variant={"secondary"} asChild>
            <Link href={`/edit/${apiKey}`}>
              <PencilIcon />
              <span>Edit</span>
            </Link>
          </Button>
          <DeleteKey
            apiKey={apiKey}
            apiKeyName={apiKeyData.name}
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
          />
        </span>
      </TableCell>
    </TableRow>
  );
};

export default KeyTableRow;
