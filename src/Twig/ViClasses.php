<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

class ViClasses extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            new TwigFunction('vi_define_classes', [$this, 'defineClasses']),
        ];
    }

    public function getFilters(): array
    {
        return [
            new TwigFilter('vi_attr_classes', [$this, 'attrClasses']),
        ];
    }

    public function attrClasses(?array $classes): \Twig\Markup
    {
        if (empty($classes)) {
            return new \Twig\Markup('', 'UTF-8');
        }

        $classes = \array_filter($classes);
        $classes = \array_unique($classes);

        if (empty($classes)) {
            return new \Twig\Markup('', 'UTF-8');
        }

        return new \Twig\Markup('class="' . \implode(' ', $classes) . '"', 'UTF-8');
    }

    public function defineClasses(array $defaultClasses, array $customClasses = [], bool $replace = false): array
    {
        $classes = [];

        if ($replace) {
            $classes = \array_replace_recursive($defaultClasses, $customClasses);
        } else {
            $classes = \array_merge_recursive($defaultClasses, $customClasses);
        }

        return $classes;
    }
}
