import { PostgresStoreState, postgresStore } from "@/stores/postgres-store";
import { ReactNode, createContext, useContext } from "react";
import { useStore } from "zustand";

const PostgresContext = createContext<typeof postgresStore>(postgresStore);

interface PostgresContextProviderProps {
    children: ReactNode;
    store: typeof postgresStore;
}

const PostgresContextProvider = ({ children, store }: PostgresContextProviderProps) => {
    return <PostgresContext.Provider value={store}>{children}</PostgresContext.Provider>;
};

const usePostgresStore = <T,>(selector: (state: PostgresStoreState) => T): T => {
    const store = useContext(PostgresContext);
    if (!store) {
        throw new Error("usePostgresStore must be used within a PostgresContextProvider");
    }

    return useStore(store, selector);
};

export { PostgresContextProvider, usePostgresStore };
