<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Fyrst\ViewsTheme\Service\ThemeParametersResolver;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\Markup;
use Twig\TwigFunction;

class ViIcon extends AbstractExtension
{
    private string $bundlePath;

    /**
     * @var array<string, mixed>|null
     */
    private ?array $themeIconDefaults = null;

    private bool $themeIconDefaultsResolved = false;

    public function __construct(
        private readonly ThemeParametersResolver $themeParametersResolver,
        private readonly RequestStack $requestStack,
    ) {
        $this->bundlePath = \dirname(__DIR__, 2);
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('vi_icon', [$this, 'iconMarkup']),
        ];
    }

    /**
     * @param array<string, mixed>|null $options
     */
    public function iconMarkup(string $name, ?array $options = []): Markup
    {
        $options = \array_merge($this->getThemeIconDefaults(), $options ?? []);

        $pack = $options['pack'] ?? 'default';
        $ariaHidden = $options['ariaHidden'] ?? true;
        $ariaLabel = $options['ariaLabel'] ?? null;
        $mode = $options['mode'] ?? 'svg';

        $attr = !empty($options['attr']) && \is_array($options['attr']) ? $options['attr'] : [];
        $extraClass = $options['class'] ?? ($attr['class'] ?? null);
        unset($attr['class']);

        if ($mode === 'css') {
            $classes = ['icon'];
            if ($pack === 'default') {
                $classes[] = "icon-{$name}";
            } elseif (\is_string($pack)) {
                $classes[] = "icon-{$name}-{$pack}";
            }
            $classes = $this->mergeClasses($classes, $extraClass);
            $attributes = $this->buildRootAttributes($classes, $ariaHidden, $ariaLabel, $attr);
            $html = '<span' . $attributes . '></span>';

            return new Markup($html, 'UTF-8');
        }

        $svgPath = $this->bundlePath . '/Resources/app/storefront/src/assets/icon/' . $pack . '/' . $name . '.svg';

        $svg = '';
        if (\file_exists($svgPath)) {
            $svg = \file_get_contents($svgPath) ?: '';
        }

        $classes = $this->mergeClasses(['icon', 'icon-' . $name], $extraClass);
        $attributes = $this->buildRootAttributes($classes, $ariaHidden, $ariaLabel, $attr);

        $svg = \preg_replace('/<svg\b([^>]*)>/i', '<svg$1' . $attributes . '>', $svg, 1) ?? $svg;

        return new Markup($svg, 'UTF-8');
    }

    /**
     * @param list<string> $classes
     * @param array<string, mixed> $attr
     */
    private function buildRootAttributes(array $classes, mixed $ariaHidden, mixed $ariaLabel, array $attr): string
    {
        $attributes = ' class="' . \htmlspecialchars(\implode(' ', $classes), \ENT_QUOTES, 'UTF-8') . '"';

        if ($ariaHidden) {
            $attributes .= ' aria-hidden="true"';
        }

        if ($ariaLabel !== null) {
            $attributes .= ' aria-label="' . \htmlspecialchars((string) $ariaLabel, \ENT_QUOTES, 'UTF-8') . '"';
        }

        foreach ($attr as $key => $value) {
            if ($value === false || $value === null) {
                continue;
            }

            if ($value === true) {
                $attributes .= ' ' . $key;
                continue;
            }

            $attributes .= ' ' . $key . '="' . \htmlspecialchars((string) $value, \ENT_QUOTES, 'UTF-8') . '"';
        }

        return $attributes;
    }

    /**
     * @param list<string> $classes
     * @return list<string>
     */
    private function mergeClasses(array $classes, mixed $extraClass): array
    {
        if (\is_string($extraClass) && $extraClass !== '') {
            $parts = \preg_split('/\s+/', \trim($extraClass)) ?: [];
            foreach ($parts as $part) {
                if ($part !== '') {
                    $classes[] = $part;
                }
            }
        } elseif (\is_array($extraClass)) {
            foreach ($extraClass as $part) {
                if (\is_string($part) && $part !== '') {
                    $classes[] = $part;
                }
            }
        }

        return $classes;
    }

    /**
     * @return array<string, mixed>
     */
    private function getThemeIconDefaults(): array
    {
        if ($this->themeIconDefaultsResolved) {
            return $this->themeIconDefaults ?? [];
        }

        $this->themeIconDefaultsResolved = true;
        $this->themeIconDefaults = [];

        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return $this->themeIconDefaults;
        }

        $context = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);
        if (!$context instanceof SalesChannelContext) {
            return $this->themeIconDefaults;
        }

        $themeParameters = $this->themeParametersResolver->resolve($request, $context);
        $icons = \is_array($themeParameters) ? ($themeParameters['icons'] ?? null) : null;

        if (\is_array($icons)) {
            $this->themeIconDefaults = \array_filter(
                [
                    'pack' => $icons['pack'] ?? null,
                    'mode' => $icons['mode'] ?? null,
                ],
                static fn (mixed $value): bool => $value !== null && $value !== '',
            );
        }

        return $this->themeIconDefaults;
    }
}
