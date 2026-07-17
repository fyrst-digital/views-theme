<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Twig\Extension\AbstractExtension;
use Twig\Markup;
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
            new TwigFilter('vi_classes', [$this, 'classes']),
        ];
    }

    /**
     * Outputs a full HTML class attribute: class="a b"
     */
    public function attrClasses(mixed $classes): Markup
    {
        $normalized = $this->normalizeClassList($classes);

        if ($normalized === []) {
            return new Markup('', 'UTF-8');
        }

        return new Markup('class="' . \implode(' ', $normalized) . '"', 'UTF-8');
    }

    /**
     * Outputs a bare class string for form additionalClass / attribute bags.
     */
    public function classes(mixed $classes): string
    {
        $normalized = $this->normalizeClassList($classes);

        if ($normalized === []) {
            return '';
        }

        return \implode(' ', $normalized);
    }

    /**
     * @param array<string, mixed> $defaultClasses
     * @param array<string, mixed> $customClasses
     * @param array<string, mixed> $options
     *
     * @return array<string, mixed>
     */
    public function defineClasses(
        array $defaultClasses,
        array $customClasses = [],
        array $options = [],
    ): array {
        $options = $this->normalizeOptions($options);

        $result = $this->normalizeMap($defaultClasses);

        if ($options['variants'] !== [] && $options['props'] !== []) {
            $result = $this->applyVariants($result, $options['variants'], $options['props']);
        }

        if ($customClasses !== []) {
            $result = $this->mergeMaps(
                $result,
                $this->normalizeMap($customClasses),
                $options['replace'],
            );
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $options
     *
     * @return array{replace: list<string>, variants: array<string, mixed>, props: array<string, mixed>}
     */
    private function normalizeOptions(array $options): array
    {
        // Accept both "replace" and legacy "replaceClasses" option keys as key lists
        $replace = $options['replace'] ?? $options['replaceClasses'] ?? [];
        if (!\is_array($replace)) {
            $replace = [];
        }

        $variants = $options['variants'] ?? [];
        if (!\is_array($variants)) {
            $variants = [];
        }

        $props = $options['props'] ?? [];
        if (!\is_array($props)) {
            $props = [];
        }

        return [
            'replace' => \array_values(\array_map('strval', $replace)),
            'variants' => $variants,
            'props' => $props,
        ];
    }

    /**
     * @param array<string, mixed> $map
     * @param array<string, mixed> $variants
     * @param array<string, mixed> $props
     *
     * @return array<string, mixed>
     */
    private function applyVariants(array $map, array $variants, array $props): array
    {
        foreach ($props as $prop => $value) {
            if (!\is_string($prop) || !\array_key_exists($prop, $variants) || !\is_array($variants[$prop])) {
                continue;
            }

            $variantMap = $this->resolveVariantEntry($variants[$prop], $value);
            if ($variantMap === null) {
                continue;
            }

            $map = $this->mergeMaps($map, $this->normalizeMap($variantMap), []);
        }

        return $map;
    }

    /**
     * @param array<string|int, mixed> $variantGroup
     *
     * @return array<string, mixed>|null
     */
    private function resolveVariantEntry(array $variantGroup, mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (\is_bool($value)) {
            $key = $value ? 'true' : 'false';
            if (\array_key_exists($key, $variantGroup) && \is_array($variantGroup[$key])) {
                return $variantGroup[$key];
            }

            if (\array_key_exists($value, $variantGroup) && \is_array($variantGroup[$value])) {
                return $variantGroup[$value];
            }

            return null;
        }

        if (\is_int($value) || \is_float($value)) {
            $key = (string) $value;
            if (\array_key_exists($key, $variantGroup) && \is_array($variantGroup[$key])) {
                return $variantGroup[$key];
            }
            if (\array_key_exists($value, $variantGroup) && \is_array($variantGroup[$value])) {
                return $variantGroup[$value];
            }

            return null;
        }

        if (\is_string($value)) {
            if ($value === '') {
                return null;
            }
            if (\array_key_exists($value, $variantGroup) && \is_array($variantGroup[$value])) {
                return $variantGroup[$value];
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $base
     * @param array<string, mixed> $override
     * @param list<string> $replace
     *
     * @return array<string, mixed>
     */
    private function mergeMaps(array $base, array $override, array $replace): array
    {
        foreach ($override as $key => $value) {
            $key = (string) $key;
            $shouldReplace = \in_array($key, $replace, true);

            if ($shouldReplace || !\array_key_exists($key, $base)) {
                $base[$key] = $value;
                continue;
            }

            $existing = $base[$key];

            if ($this->isClassList($existing) && $this->isClassList($value)) {
                $base[$key] = $this->normalizeClassList(\array_merge($existing, $value));
                continue;
            }

            if ($this->isAssocMap($existing) && $this->isAssocMap($value)) {
                $base[$key] = $this->mergeMaps($existing, $value, []);
                continue;
            }

            $base[$key] = $value;
        }

        return $base;
    }

    /**
     * @param array<string|int, mixed> $map
     *
     * @return array<string, mixed>
     */
    private function normalizeMap(array $map): array
    {
        $result = [];

        foreach ($map as $key => $value) {
            $key = (string) $key;

            if ($this->isClassList($value) || \is_string($value) || $value === null) {
                $result[$key] = $this->normalizeClassList($value);
                continue;
            }

            if (\is_array($value)) {
                if ($value === []) {
                    $result[$key] = [];
                    continue;
                }

                if ($this->isAssocMap($value)) {
                    $result[$key] = $this->normalizeMap($value);
                    continue;
                }

                $result[$key] = $this->normalizeClassList($value);
                continue;
            }

            $result[$key] = $value;
        }

        return $result;
    }

    /**
     * @return list<string>
     */
    private function normalizeClassList(mixed $classes): array
    {
        if ($classes === null || $classes === false || $classes === '') {
            return [];
        }

        if (\is_string($classes)) {
            $classes = \preg_split('/\s+/', \trim($classes)) ?: [];
        }

        if (!\is_array($classes)) {
            return [];
        }

        $result = [];
        foreach ($classes as $class) {
            if ($class === null || $class === false || $class === '') {
                continue;
            }
            if (!\is_scalar($class)) {
                continue;
            }
            $result[] = (string) $class;
        }

        return \array_values(\array_unique($result));
    }

    private function isClassList(mixed $value): bool
    {
        if (!\is_array($value)) {
            return false;
        }

        if ($value === []) {
            return true;
        }

        return !$this->isAssocMap($value);
    }

    private function isAssocMap(mixed $value): bool
    {
        if (!\is_array($value) || $value === []) {
            return false;
        }

        foreach (\array_keys($value) as $key) {
            if (\is_string($key)) {
                return true;
            }
        }

        return false;
    }
}
