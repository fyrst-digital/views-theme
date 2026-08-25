<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Storefront\Page\Account\Login\AccountLoginPage;
use Shopware\Storefront\Page\Address\Detail\AddressDetailPage;
use Shopware\Storefront\Page\Address\Listing\AddressListingPage;
use Shopware\Storefront\Page\Checkout\Register\CheckoutRegisterPage;
use Symfony\Component\HttpFoundation\ParameterBag;

/**
 * Read posted bags / entities and build field view-models for class components.
 */
final class ComponentData
{
    public static function get(mixed $data, string $key): mixed
    {
        if ($data instanceof ParameterBag) {
            return $data->has($key) ? $data->get($key) : null;
        }

        if ($data instanceof Entity) {
            return $data->has($key) ? $data->get($key) : null;
        }

        if (\is_array($data)) {
            return $data[$key] ?? null;
        }

        if (\is_object($data) && method_exists($data, 'get')) {
            try {
                return $data->get($key);
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }

    public static function isFilled(mixed $data): bool
    {
        if ($data instanceof ParameterBag) {
            return $data->count() > 0;
        }

        if (\is_array($data)) {
            return $data !== [];
        }

        return $data !== null;
    }

    public static function scalar(mixed $value): ?string
    {
        if (!\is_string($value) && !is_numeric($value)) {
            return null;
        }

        $string = (string) $value;

        return $string !== '' ? $string : null;
    }

    /**
     * @return array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}
     */
    public static function field(
        string $idPrefix,
        string $prefix,
        string $idSuffix,
        string $key,
        mixed $value,
        bool $prefixedName = true,
        ?string $autocomplete = null,
    ): array {
        $name = $prefixedName && $prefix !== '' ? $prefix . '[' . $key . ']' : $key;

        $field = [
            'id' => $idPrefix . $prefix . $idSuffix,
            'name' => $name,
            'value' => $value,
            'violationPath' => $prefix !== '' ? '/' . $prefix . '/' . $key : '/' . $key,
        ];

        if ($autocomplete !== null) {
            $field['autocomplete'] = $autocomplete;
        }

        return $field;
    }

    public static function pageCountries(mixed $page): mixed
    {
        return match (true) {
            $page instanceof CheckoutRegisterPage,
            $page instanceof AccountLoginPage,
            $page instanceof AddressDetailPage,
            $page instanceof AddressListingPage => $page->getCountries(),
            default => null,
        };
    }

    public static function pageSalutations(mixed $page): mixed
    {
        return match (true) {
            $page instanceof CheckoutRegisterPage,
            $page instanceof AccountLoginPage,
            $page instanceof AddressDetailPage,
            $page instanceof AddressListingPage => $page->getSalutations(),
            default => null,
        };
    }
}
