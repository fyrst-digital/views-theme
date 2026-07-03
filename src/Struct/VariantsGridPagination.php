<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

use Shopware\Core\Framework\Struct\Struct;

class VariantsGridPagination extends Struct
{
    public function __construct(
        private readonly int $page,
        private readonly int $limit,
        private readonly int $total,
    ) {
    }

    public function getPage(): int
    {
        return $this->page;
    }

    public function getLimit(): int
    {
        return $this->limit;
    }

    public function getTotal(): int
    {
        return $this->total;
    }
}
