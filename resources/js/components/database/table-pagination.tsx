import If from "@/components/if";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo } from "react";

interface TablePaginationProps {
    pagination: {
        page: number;
        perPage: number;
        total: number;
    };
    handlePerPageChange: (value: string) => void;
    setPagination: (pagination: { page: number; perPage: number; total: number }) => void;
    queryMode: boolean;
}

const TablePagination = ({ pagination, handlePerPageChange, setPagination, queryMode }: TablePaginationProps) => {
    const shouldPaginate = useMemo(() => {
        return pagination.total > pagination.perPage;
    }, [pagination.total, pagination.perPage]);

    return (
        <div className="sticky bottom-0 flex items-center justify-between border-t px-4 py-2">
            <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                    <If condition={!queryMode}>
                        Showing {(pagination.page - 1) * pagination.perPage + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)}{" "}
                        of {pagination.total} rows
                    </If>
                    <If condition={queryMode}>Showing {pagination.total} rows</If>
                </div>
            </div>

            <If condition={!queryMode}>
                <div className="flex gap-4 align-middle">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show</span>
                        <Select value={pagination.perPage.toString()} onValueChange={handlePerPageChange}>
                            <SelectTrigger className="h-8 w-[80px]">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-500">per page</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1 || !shouldPaginate}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage) || !shouldPaginate}
                        >
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>
            </If>
        </div>
    );
};

export default TablePagination;
