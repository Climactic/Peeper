import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderIcon } from "lucide-react";

interface SchemaData {
    schema_name: string;
}

interface SchemaSelectorProps {
    loading: boolean;
    selectedSchema: string | null;
    schemas: SchemaData[];
    onSchemaSelect: (schema: string) => void;
}

const SchemaSelector = ({ loading, selectedSchema, schemas, onSchemaSelect }: SchemaSelectorProps) => {
    if (loading && !selectedSchema) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <FolderIcon className="mr-2 h-4 w-4" /> {selectedSchema ?? "Select Schema"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-68">
                <ScrollArea className="max-h-[300px] overflow-y-auto">
                    {schemas.map((schema) => (
                        <DropdownMenuItem key={schema.schema_name} onClick={() => onSchemaSelect(schema.schema_name)}>
                            {schema.schema_name}
                        </DropdownMenuItem>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SchemaSelector;
