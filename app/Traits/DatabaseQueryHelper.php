<?php

namespace App\Traits;

trait DatabaseQueryHelper
{
    /**
     * Split a SQL string into individual statements.
     */
    protected function splitSqlStatements(string $sql): array
    {
        $sql = trim($sql);

        if (empty($sql)) {
            return [];
        }

        // Split by semicolons, but not those inside quotes
        $statements = [];
        $currentStatement = '';
        $inSingleQuote = false;
        $inDoubleQuote = false;
        $length = strlen($sql);

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $currentStatement .= $char;

            // Handle quotes
            if ($char === "'" && ($i === 0 || $sql[$i - 1] !== '\\')) {
                $inSingleQuote = ! $inSingleQuote;
            } elseif ($char === '"' && ($i === 0 || $sql[$i - 1] !== '\\')) {
                $inDoubleQuote = ! $inDoubleQuote;
            }

            // End of statement if we find a semicolon outside of quotes
            if ($char === ';' && ! $inSingleQuote && ! $inDoubleQuote) {
                $statements[] = trim($currentStatement);
                $currentStatement = '';
            }
        }

        // Add the last statement if there is one (without a trailing semicolon)
        if (! empty($currentStatement)) {
            $statements[] = trim($currentStatement);
        }

        // Remove empty statements
        return array_filter($statements, function ($stmt) {
            return ! empty(trim($stmt));
        });
    }

    /**
     * Sanitize an SQL identifier (table name, column name, etc.)
     */
    protected function sanitizeIdentifier(string $identifier): string
    {
        // Split by period to handle schema.table.column format
        $parts = explode('.', $identifier);
        $sanitizedParts = [];

        foreach ($parts as $part) {
            // Allow only alphanumeric and underscore characters
            $sanitized = preg_replace('/[^a-zA-Z0-9_]/', '', $part);

            // Skip empty parts
            if (empty($sanitized)) {
                continue;
            }

            $sanitizedParts[] = $sanitized;
        }

        return implode('.', $sanitizedParts);
    }

    /**
     * Helper function to interpolate query values for logging.
     */
    protected function interpolateQuery(string $query, array $values): string
    {
        $interpolated = $query;
        foreach ($values as $value) {
            $value = is_null($value) ? 'NULL' : "'".addslashes($value)."'";
            $position = strpos($interpolated, '?');
            if ($position !== false) {
                $interpolated = substr_replace($interpolated, $value, $position, 1);
            }
        }

        return $interpolated;
    }
}
