<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Symfony\Component\HttpFoundation\Request;

/**
 * Parses listing filter selection from the request query/body.
 */
final class FilterRequestSelection
{
    /**
     * @return array<string, list<string>>
     */
    public function selectedFromRequest(Request $request): array
    {
        return [
            'manufacturer' => $this->splitParam($request->get('manufacturer')),
            'properties' => $this->splitParam($request->get('properties')),
            'rating' => $this->splitParam($request->get('rating')),
            'shipping-free' => $this->splitParam($request->get('shipping-free')),
        ];
    }

    public function requestHasFilterParams(Request $request): bool
    {
        foreach (['manufacturer', 'properties', 'rating', 'shipping-free', 'min-price', 'max-price'] as $key) {
            $value = $request->get($key);
            if (\is_string($value) && $value !== '') {
                return true;
            }
            if (\is_array($value) && $value !== []) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<string>
     */
    public function splitParam(mixed $raw): array
    {
        if (\is_array($raw)) {
            return array_values(array_filter(array_map('strval', $raw), static fn (string $v): bool => $v !== ''));
        }

        if (!\is_string($raw) || $raw === '') {
            return [];
        }

        return array_values(array_filter(explode('|', $raw), static fn (string $v): bool => $v !== ''));
    }
}
