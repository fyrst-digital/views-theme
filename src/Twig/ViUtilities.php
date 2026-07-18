<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Symfony\UX\TwigComponent\ComponentAttributes;
use Symfony\UX\TwigComponent\CVA;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

class ViUtilities extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('vi_merge_deep', [$this, 'mergeDeep']),
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('vi_cva', [$this, 'cvaMap']),
        ];
    }

    public function mergeDeep(array $source, array $target): array
    {
        return array_merge_recursive($source, $target);
    }

    /**
     * Build CVA slots from a classes map, binding attribute class extras.
     *
     * - root → attributes.render('class')
     * - other keys → attributes.nested(key).render('class')
     *
     * @param array<string, array<string, mixed>> $classes
     *
     * @return array<string, ViCvaSlot>
     */
    public function cvaMap(array $classes, ComponentAttributes $attributes): array
    {
        $map = [];

        foreach ($classes as $slot => $config) {
            if (!\is_array($config)) {
                continue;
            }

            $cva = new CVA(
                $config['base'] ?? '',
                $config['variants'] ?? [],
                $config['compoundVariants'] ?? [],
                $config['defaultVariants'] ?? [],
            );

            $extraClass = $slot === 'root'
                ? $attributes->render('class')
                : $attributes->nested((string) $slot)->render('class');

            $map[(string) $slot] = new ViCvaSlot($cva, $extraClass);
        }

        return $map;
    }
}
