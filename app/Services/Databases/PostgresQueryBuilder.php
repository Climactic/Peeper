<?php

namespace App\Services\Databases;

use App\Traits\DatabaseQueryHelper;
use Illuminate\Support\Facades\Config;

class PostgresQueryBuilder
{
    use DatabaseQueryHelper;

    /**
     * Get the default queries from config.
     */
    public function getDefaultQueries(): array
    {
        return Config::get('queries.postgres', []);
    }

    /**
     * Get a specific default query by type.
     *
     * @param  string  $type
     */
    public function getDefaultQuery($type): ?array
    {
        return Config::get('queries.postgres')[$type] ?? null;
    }

    /**
     * Build a SQL WHERE clause from an array of filters.
     *
     * @return array Returns ['sql' => string, 'bindings' => array]
     */
    public function buildWhereClauseFromFilters(array $filters): array
    {
        if (empty($filters)) {
            return ['sql' => '', 'bindings' => []];
        }

        $whereConditions = [];
        $bindings = [];

        foreach ($filters as $filter) {
            if (empty($filter['column']) || empty($filter['operator'])) {
                continue;
            }

            // Sanitize the column name to prevent SQL injection
            $column = $this->sanitizeIdentifier($filter['column']);
            if (empty($column)) {
                continue; // Skip if column name became empty after sanitization
            }

            $operator = $filter['operator'];
            $value = $filter['value'] ?? null;

            // For string operations (LIKE, ILIKE), cast column to text to ensure compatibility with all data types
            $castColumn = $column;
            if (in_array($operator, ['like', 'ilike'])) {
                $castColumn = "CAST({$column} AS TEXT)";
            }

            switch ($operator) {
                case 'eq':
                    $whereConditions[] = "{$column} = ?";
                    $bindings[] = $value;
                    break;
                case 'neq':
                    $whereConditions[] = "{$column} <> ?";
                    $bindings[] = $value;
                    break;
                case 'gt':
                    $whereConditions[] = "{$column} > ?";
                    $bindings[] = $value;
                    break;
                case 'gte':
                    $whereConditions[] = "{$column} >= ?";
                    $bindings[] = $value;
                    break;
                case 'lt':
                    $whereConditions[] = "{$column} < ?";
                    $bindings[] = $value;
                    break;
                case 'lte':
                    $whereConditions[] = "{$column} <= ?";
                    $bindings[] = $value;
                    break;
                case 'like':
                    $whereConditions[] = "{$castColumn} LIKE ?";
                    $bindings[] = "%{$value}%";
                    break;
                case 'ilike':
                    $whereConditions[] = "{$castColumn} ILIKE ?";
                    $bindings[] = "%{$value}%";
                    break;
                case 'is':
                    $upperValue = strtoupper($value);
                    if (in_array($upperValue, ['TRUE', 'FALSE', 'NULL'])) {
                        $whereConditions[] = "{$column} IS {$upperValue}";
                    } else {
                        $whereConditions[] = "{$column} = ?";
                        $bindings[] = $value;
                    }
                    break;
                case 'is_not':
                    $upperValue = strtoupper($value);
                    if (in_array($upperValue, ['TRUE', 'FALSE', 'NULL'])) {
                        $whereConditions[] = "{$column} IS NOT {$upperValue}";
                    } else {
                        $whereConditions[] = "{$column} <> ?";
                        $bindings[] = $value;
                    }
                    break;
                case 'between':
                    if (is_array($value) && count($value) === 2) {
                        $whereConditions[] = "{$column} BETWEEN ? AND ?";
                        $bindings[] = $value[0];
                        $bindings[] = $value[1];
                    }
                    break;
                case 'not_between':
                    if (is_array($value) && count($value) === 2) {
                        $whereConditions[] = "{$column} NOT BETWEEN ? AND ?";
                        $bindings[] = $value[0];
                        $bindings[] = $value[1];
                    }
                    break;
                case 'in':
                    if (is_array($value) && ! empty($value)) {
                        $placeholders = implode(', ', array_fill(0, count($value), '?'));
                        $whereConditions[] = "{$column} IN ({$placeholders})";
                        $bindings = array_merge($bindings, $value);
                    } elseif (! is_array($value) && ! empty($value)) {
                        $values = array_map('trim', explode(',', $value));
                        if (! empty($values)) {
                            $placeholders = implode(', ', array_fill(0, count($values), '?'));
                            $whereConditions[] = "{$column} IN ({$placeholders})";
                            $bindings = array_merge($bindings, $values);
                        }
                    }
                    break;
                case 'not_in':
                    if (is_array($value) && ! empty($value)) {
                        $placeholders = implode(', ', array_fill(0, count($value), '?'));
                        $whereConditions[] = "{$column} NOT IN ({$placeholders})";
                        $bindings = array_merge($bindings, $value);
                    } elseif (! is_array($value) && ! empty($value)) {
                        $values = array_map('trim', explode(',', $value));
                        if (! empty($values)) {
                            $placeholders = implode(', ', array_fill(0, count($values), '?'));
                            $whereConditions[] = "{$column} NOT IN ({$placeholders})";
                            $bindings = array_merge($bindings, $values);
                        }
                    }
                    break;
                case 'is_null':
                    $whereConditions[] = "{$column} IS NULL";
                    break;
                case 'is_not_null':
                    $whereConditions[] = "{$column} IS NOT NULL";
                    break;
            }
        }

        if (empty($whereConditions)) {
            return ['sql' => '', 'bindings' => []];
        }

        return [
            'sql' => implode(' AND ', $whereConditions),
            'bindings' => $bindings,
        ];
    }

    /**
     * Build an ORDER BY clause from sorting options
     *
     * @return array Returns ['sql' => string, 'bindings' => array]
     */
    public function buildOrderByClause(array $sorting): array
    {
        if (empty($sorting)) {
            return ['sql' => '', 'bindings' => []];
        }

        $orderByClauses = [];

        foreach ($sorting as $sort) {
            if (empty($sort['column']) || empty($sort['direction'])) {
                continue;
            }

            // Sanitize column name to prevent SQL injection
            $column = $this->sanitizeIdentifier($sort['column']);
            $direction = strtoupper($sort['direction']) === 'DESC' ? 'DESC' : 'ASC';

            if (! empty($column)) {
                $orderByClauses[] = "{$column} {$direction}";
            }
        }

        if (empty($orderByClauses)) {
            return ['sql' => '', 'bindings' => []];
        }

        return [
            'sql' => implode(', ', $orderByClauses),
            'bindings' => [],
        ];
    }
}
