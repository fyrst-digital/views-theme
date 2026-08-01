<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Pagination — page window + gates; Twig composes nav markup.
 */
#[AsTwigComponent]
class Pagination
{
    public mixed $entities = null;

    public ?int $currentPage = null;

    public ?int $totalPages = null;

    public ?string $location = null;

    public bool $href = true;

    public string $pageParameter = 'p';

    public string $searchQuery = '';

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

        return '?' . $this->pageParameter . '=' . $page . $this->searchQuery;
    }
}
