<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\SalesChannelRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Theme\ThemeConfigValueAccessor;
use Symfony\Component\HttpFoundation\RequestStack;

class ThemeCssVariables
{
    /**
     * SCSS-only color and math functions have no CSS equivalent.
     * CSS-native functions (rgb, rgba, hsl, calc, …) stay.
     */
    private const SCSS_FUNCTION_PATTERN = '/\b(?:darken|lighten|saturate|desaturate|mix|adjust-hue|tint|shade|fade-in|fade-out|opacify|transparentize|invert|complement|change-color|adjust-color|scale-color|hue|saturation|lightness|red|green|blue|alpha|opacity)\s*\(/';

    public function __construct(
        private readonly ThemeParametersResolver $themeParametersResolver,
        private readonly ThemeConfigValueAccessor $themeConfig,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * Theme fields with `"css": true` as custom properties. `scss` is not consulted.
     *
     * @return array<string, string|int>
     */
    public function resolve(SalesChannelContext $context): array
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return [];
        }

        $themeId = $request->attributes->get(SalesChannelRequest::ATTRIBUTE_THEME_ID);
        if (!is_string($themeId) || $themeId === '') {
            return [];
        }

        $themeJson = $this->themeParametersResolver->resolve($request, $context);
        $fields = $themeJson['config']['fields'] ?? null;
        if (!is_array($fields)) {
            return [];
        }

        $variables = [];

        foreach ($fields as $key => $data) {
            if (!is_string($key) || !is_array($data) || ($data['css'] ?? false) !== true || !isset($data['type']) || !is_string($data['type'])) {
                continue;
            }

            $safeKey = $this->sanitizeKey($key);
            if ($safeKey === null) {
                continue;
            }

            $formatted = $this->formatValue($data['type'], $this->themeConfig->get($key, $context, $themeId));
            if ($formatted === null) {
                continue;
            }

            $variables[$safeKey] = $formatted;
        }

        return $variables;
    }

    private function formatValue(string $type, mixed $value): string|int|null
    {
        if ($value === null || is_array($value) || is_bool($value)) {
            return null;
        }

        if ($type === 'media' || $type === 'url') {
            if ($type === 'media' && Uuid::isValid((string) $value)) {
                return null;
            }

            $escapedUrl = addcslashes((string) $value, "\\'\n\r");

            return $this->sanitizeValue(sprintf('url(\'%s\')', $escapedUrl));
        }

        if ($type === 'switch' || $type === 'checkbox') {
            return (int) $value;
        }

        $stringValue = (string) $value;

        if (preg_match(self::SCSS_FUNCTION_PATTERN, $stringValue)) {
            return null;
        }

        if (str_contains($stringValue, '$')) {
            if (!$this->isSafeScssVariableExpression($stringValue)) {
                return null;
            }

            $stringValue = (string) preg_replace('/\$([a-zA-Z][a-zA-Z0-9_-]*)/', 'var(--$1)', $stringValue);
        }

        return $this->sanitizeValue($stringValue);
    }

    private function isSafeScssVariableExpression(string $value): bool
    {
        if (str_contains($value, '(')) {
            return false;
        }

        if (preg_match('/[!@;{}]|#\{/', $value) === 1) {
            return false;
        }

        if (preg_match('/^[\s$#%.,:+\-*\/_a-zA-Z0-9-]+$/', $value) !== 1) {
            return false;
        }

        return preg_match('/\$(?![a-zA-Z][a-zA-Z0-9_-]*)/', $value) !== 1;
    }

    private function sanitizeKey(string $key): ?string
    {
        $sanitizedKey = str_replace(["\n", "\r", ';', '{', '}', '<', '>', '&', '"', '\''], '', $key);

        return $sanitizedKey !== '' ? $sanitizedKey : null;
    }

    private function sanitizeValue(string $value): string
    {
        return str_replace(
            [';', '{', '}', "\n", "\r", '<', '>', '&'],
            ['\\3B ', '\\7B ', '\\7D ', ' ', ' ', '\\3C ', '\\3E ', '\\26 '],
            $value
        );
    }
}
