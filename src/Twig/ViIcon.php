<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;
use Twig\Markup;

class ViIcon extends AbstractExtension
{
    private string $bundlePath;

    public function __construct()
    {
        $this->bundlePath = \dirname(__DIR__, 2);
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('vi_icon', [$this, 'iconMarkup']),
        ];
    }

    public function iconMarkup(string $name, ?array $options = []): Markup
    {
        $pack = $options['pack'] ?? 'default';
        $ariaHidden = $options['ariaHidden'] ?? true;
        $ariaLabel = $options['ariaLabel'] ?? null;
        $mode = $options['mode'] ?? 'svg';

        if ($mode ===  'css') {
            $classes = ['icon'];
            if ($pack === 'default') {
                $classes[] = "icon-{$name}";
            } else if (is_string($pack)) {
                $classes[] = "icon-{$name}-{$pack}";
            }
            $classAttr = \implode(' ', $classes);
            $classAttr = "class=\"{$classAttr}\"";
            $html = "<span {$classAttr}></span>";
            return new Markup($html, 'UTF-8');
        }

        // Build SVG file path
        $svgPath = $this->bundlePath . '/Resources/app/storefront/src/assets/icon/' . $pack . '/' . $name . '.svg';

        $svg = '';
        if (\file_exists($svgPath)) {
            $svg = \file_get_contents($svgPath);
        }

        // Build CSS classes
        $classes = ['icon', 'icon-' . $name];

        $classString = \implode(' ', $classes);

        $attributes = ' class="' . \htmlspecialchars($classString, \ENT_QUOTES, 'UTF-8') . '"';

        if ($ariaHidden) {
            $attributes .= ' aria-hidden="true"';
        }

        if ($ariaLabel !== null) {
            $attributes .= ' aria-label="' . \htmlspecialchars($ariaLabel, \ENT_QUOTES, 'UTF-8') . '"';
        }

        // Allow passing custom HTML attributes via options['attr']
        if (!empty($options['attr']) && \is_array($options['attr'])) {
            foreach ($options['attr'] as $key => $value) {
                $attributes .= ' ' . $key . '="' . \htmlspecialchars((string) $value, \ENT_QUOTES, 'UTF-8') . '"';
            }
        }

        // Inject attributes into the <svg> opening tag
        $svg = \preg_replace('/<svg\b([^>]*)>/i', '<svg$1' . $attributes . '>', $svg, 1);

        return new Markup($svg, 'UTF-8');
    }
}
