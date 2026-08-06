<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Pagination — page window + gates; Twig composes leaf controls.
 */
#[AsTwigComponent]
class Pagination
{
    private const QUERY_DENYLIST = [
        'boxLayout',
        'referrerCategoryId',
        'no-aggregations',
        'only-aggregations',
        'reduce-aggregations',
        'slots',
    ];

    public mixed $entities = null;

    public ?int $currentPage = null;

    public ?int $totalPages = null;

    public ?string $location = null;

    public bool $href = true;

    public string $pageParameter = 'p';

    /**
     * Legacy suffix (e.g. `&search=…`). Prefer {@see $query}.
     */
    public string $searchQuery = '';

    /**
     * Query params preserved on every page href (filters, sort, search, …).
     * Page parameter is overwritten per link; denylisted display keys are stripped when built via preserveQuery.
     *
     * @var array<string, string>
     */
    public array $query = [];

    /**
     * When true and {@see $query} is empty, fill query from the current request (listing use).
     * Leave false for non-listing consumers (e.g. VariantsGrid).
     */
    public bool $preserveQuery = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public int $start = 1;

    public int $end = 1;

    public int $prevPage = 1;

    public int $nextPage = 1;

    public bool $isFirst = true;

    public bool $isLast = true;

    public function __construct(
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->entities instanceof EntitySearchResult) {
            $this->currentPage ??= $this->entities->getPage();
            if ($this->totalPages === null) {
                $limit = $this->entities->getLimit() ?: 1;
                $this->totalPages = (int) ceil($this->entities->getTotal() / $limit);
            }
        }

        $this->currentPage = max(1, (int) ($this->currentPage ?? 1));
        $this->totalPages = max(1, (int) ($this->totalPages ?? 1));

        $this->query = $this->normalizeQuery($this->query);

        if ($this->query === [] && $this->searchQuery !== '') {
            $this->query = $this->queryFromSearchQuery($this->searchQuery);
        }

        if ($this->preserveQuery && $this->query === []) {
            $this->query = $this->queryFromRequest();
        }

        unset($this->query[$this->pageParameter]);

        $this->visible = $this->totalPages > 1;
        if (!$this->visible) {
            return;
        }

        $this->isFirst = $this->currentPage <= 1;
        $this->isLast = $this->currentPage >= $this->totalPages;
        $this->prevPage = $this->isFirst ? 1 : $this->currentPage - 1;
        $this->nextPage = $this->isLast ? $this->totalPages : $this->currentPage + 1;

        $start = $this->currentPage - 2;
        if ($start <= 0) {
            $start = $this->currentPage - 1;
            if ($start <= 0) {
                $start = $this->currentPage;
            }
        }

        $end = $start + 4;
        if ($end > $this->totalPages) {
            $end = $this->totalPages;
        }

        $this->start = $start;
        $this->end = $end;
    }

    public function pageHref(int $page): string
    {
        if (!$this->href) {
            return '#';
        }

        $query = $this->query;
        $query[$this->pageParameter] = (string) $page;

        return '?' . http_build_query($query, '', '&', \PHP_QUERY_RFC3986);
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return array<string, string>
     */
    private function normalizeQuery(array $query): array
    {
        $out = [];
        foreach ($query as $key => $value) {
            if (!\is_string($key) || $key === '') {
                continue;
            }
            $normalized = $this->normalizeQueryValue($value);
            if ($normalized === null) {
                continue;
            }
            $out[$key] = $normalized;
        }

        return $out;
    }

    /**
     * @return array<string, string>
     */
    private function queryFromSearchQuery(string $searchQuery): array
    {
        $parsed = [];
        parse_str(ltrim($searchQuery, '?&'), $parsed);

        return $this->normalizeQuery($parsed);
    }

    /**
     * @return array<string, string>
     */
    private function queryFromRequest(): array
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return [];
        }

        $out = [];
        foreach ($request->query->all() as $key => $value) {
            if (!\is_string($key) || $key === '') {
                continue;
            }
            if (\in_array($key, self::QUERY_DENYLIST, true)) {
                continue;
            }
            if ($key === $this->pageParameter) {
                continue;
            }
            $normalized = $this->normalizeQueryValue($value);
            if ($normalized === null) {
                continue;
            }
            $out[$key] = $normalized;
        }

        return $out;
    }

    private function normalizeQueryValue(mixed $value): ?string
    {
        if (\is_array($value)) {
            $parts = [];
            foreach ($value as $item) {
                if (!\is_scalar($item)) {
                    continue;
                }
                $part = trim((string) $item);
                if ($part !== '') {
                    $parts[] = $part;
                }
            }

            return $parts === [] ? null : implode('|', $parts);
        }

        if ($value === null || $value === false) {
            return null;
        }

        if ($value === true) {
            return '1';
        }

        if (!\is_scalar($value)) {
            return null;
        }

        $string = (string) $value;

        return $string === '' ? null : $string;
    }
}
