<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Symfony\UX\TwigComponent\ComponentAttributes;
use Twig\Environment;
use Twig\Extension\AbstractExtension;
use Twig\Extra\Html\Cva;
use Twig\Runtime\EscaperRuntime;
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
            new TwigFunction('vi_cva', [$this, 'cvaMap'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
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
     * - other keys → attributes.nested(key).render('class'), then strip "slot:class" from attributes
     *
     * When called outside a UX component (e.g. renderView / sw_include), an empty
     * ComponentAttributes bag is created so class maps still resolve.
     *
     * @param array<string, mixed>                 $context
     * @param array<string, array<string, mixed>>  $classes
     *
     * @return array<string, ViCvaSlot>
     */
    public function cvaMap(
        Environment $env,
        array &$context,
        array $classes,
        ?ComponentAttributes $attributes = null,
    ): array {
        $attributes ??= $context['attributes'] ?? null;

        if (!$attributes instanceof ComponentAttributes) {
            $attributes = new ComponentAttributes([], $env->getRuntime(EscaperRuntime::class));
            $context['attributes'] = $attributes;
        }

        $nestedExtras = [];
        $nestedClassKeys = [];

        foreach ($classes as $slot => $config) {
            if (!\is_array($config) || $slot === 'root') {
                continue;
            }

            $slotName = (string) $slot;
            $nestedExtras[$slotName] = $attributes->nested($slotName)->render('class');
            $nestedClassKeys[] = $slotName . ':class';
        }

        if ($nestedClassKeys !== []) {
            $attributes = $attributes->without(...$nestedClassKeys);
        }

        $map = [];

        foreach ($classes as $slot => $config) {
            if (!\is_array($config)) {
                continue;
            }

            $slotName = (string) $slot;

            $cva = new Cva(
                $config['base'] ?? '',
                $config['variants'] ?? [],
                $config['compoundVariants'] ?? [],
                $config['defaultVariants'] ?? [],
            );

            $extraClass = $slotName === 'root'
                ? $attributes->render('class')
                : ($nestedExtras[$slotName] ?? null);

            $map[$slotName] = new ViCvaSlot($cva, $extraClass);
        }

        $context['attributes'] = $attributes;

        return $map;
    }
}
