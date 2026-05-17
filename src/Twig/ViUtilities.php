<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

class ViUtilities extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('vi_merge_deep', [$this, 'mergeDeep']),
        ];
    }

    public function mergeDeep(array $source, array $target): array
    {
        return array_merge_recursive($source, $target);
    }
}
