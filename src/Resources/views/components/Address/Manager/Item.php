<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Manager;

use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\System\Country\CountryEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Manager:Item — display lines, default flag, shipping block.
 */
#[AsTwigComponent]
class Item
{
    public mixed $address = null;

    public string $type = 'shipping';

    public bool $selected = false;

    /** Hydrated from Pane and List so the call chain stays valid. */
    public ?string $activeId = null;

    public ?string $defaultId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $addressId = '';

    public string $radioId = '';

    public bool $shippingBlocked = false;

    public bool $isDefault = false;

    public string $name = '';

    public string $company = '';

    public bool $showCompany = false;

    public string $extra1 = '';

    public string $extra2 = '';

    public string $street = '';

    public string $cityLine = '';

    public string $summary = '';

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->address instanceof CustomerAddressEntity) {
            return;
        }

        $this->addressId = $this->address->getId();
        $this->radioId = 'vi-address-' . $this->type . '-' . $this->addressId;
        $this->shippingBlocked = $this->isShippingBlocked($this->address);
        $this->isDefault = $this->defaultId !== null && $this->defaultId !== '' && $this->defaultId === $this->addressId;

        $person = trim($this->text($this->address->getFirstName()) . ' ' . $this->text($this->address->getLastName()));
        $company = $this->text($this->address->getCompany());
        $this->name = $person !== '' ? $person : $company;
        $this->company = $company;
        $this->showCompany = $person !== '' && $company !== '';

        $this->extra1 = $this->text($this->address->getAdditionalAddressLine1());
        $this->extra2 = $this->text($this->address->getAdditionalAddressLine2());
        $this->street = $this->text($this->address->getStreet());

        $zipCity = trim($this->text($this->address->getZipcode()) . ' ' . $this->text($this->address->getCity()));
        $this->cityLine = $this->join($zipCity, $this->countryName($this->address->getCountry()));
        $this->summary = $this->join($this->street, $zipCity);
    }

    private function isShippingBlocked(CustomerAddressEntity $address): bool
    {
        if ($this->type !== 'shipping') {
            return false;
        }

        $country = $address->getCountry();

        return !$country instanceof CountryEntity || !$country->getShippingAvailable();
    }

    private function countryName(?CountryEntity $country): string
    {
        if (!$country instanceof CountryEntity) {
            return '';
        }

        $translated = $country->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        return $this->text($country->getName());
    }

    private function text(?string $value): string
    {
        return trim($value ?? '');
    }

    private function join(string ...$parts): string
    {
        $kept = [];
        foreach ($parts as $part) {
            if ($part !== '') {
                $kept[] = $part;
            }
        }

        return implode(', ', $kept);
    }
}
