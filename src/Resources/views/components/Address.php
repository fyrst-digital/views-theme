<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderAddress\OrderAddressEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\System\Country\Aggregate\CountryState\CountryStateEntity;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\Salutation\SalutationEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address — one display string per address field.
 * fullName includes the salutation. Template owns a block and span for each field, plus the shipping Alert.
 */
#[AsTwigComponent]
class Address
{
    public CustomerAddressEntity|OrderAddressEntity|null $address = null;

    public bool $showShippingWarning = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showWarning = false;

    public string $salutation = '';

    public string $title = '';

    public string $fullName = '';

    public string $company = '';

    public string $department = '';

    public string $street = '';

    public string $additionalLine1 = '';

    public string $additionalLine2 = '';

    public string $zipcode = '';

    public string $city = '';

    public string $countryState = '';

    public string $country = '';

    public string $phone = '';

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $address = $this->address;
        $this->showWarning = $this->showShippingWarning && !$this->shippingAvailable($address);
        $this->salutation = '';
        $this->title = '';
        $this->fullName = '';
        $this->company = '';
        $this->department = '';
        $this->street = '';
        $this->additionalLine1 = '';
        $this->additionalLine2 = '';
        $this->zipcode = '';
        $this->city = '';
        $this->countryState = '';
        $this->country = '';
        $this->phone = '';

        if ($address === null) {
            return;
        }

        $this->salutation = $this->salutationName($address->getSalutation());
        $this->title = $this->text($address->getTitle());
        $this->fullName = $this->join(
            $this->salutation,
            $this->text($address->getFirstName()),
            $this->text($address->getLastName()),
        );
        $this->company = $this->text($address->getCompany());
        $this->department = $this->text($address->getDepartment());
        $this->street = $this->text($address->getStreet());
        $this->additionalLine1 = $this->text($address->getAdditionalAddressLine1());
        $this->additionalLine2 = $this->text($address->getAdditionalAddressLine2());
        $this->zipcode = $this->text($address->getZipcode());
        $this->city = $this->text($address->getCity());
        $this->countryState = $this->stateName($address->getCountryState());
        $this->country = $this->countryName($address->getCountry());
        $this->phone = $this->text($address->getPhoneNumber());
    }

    private function shippingAvailable(CustomerAddressEntity|OrderAddressEntity|null $address): bool
    {
        $country = $address?->getCountry();

        return $country instanceof CountryEntity && $country->getShippingAvailable();
    }

    private function salutationName(?SalutationEntity $salutation): string
    {
        if (!$salutation instanceof SalutationEntity || $salutation->getSalutationKey() === 'not_specified') {
            return '';
        }

        return $this->translated($salutation, 'displayName', $salutation->getDisplayName());
    }

    private function join(string ...$parts): string
    {
        return implode(' ', array_filter($parts, static fn (string $part): bool => $part !== ''));
    }

    private function stateName(?CountryStateEntity $state): string
    {
        if (!$state instanceof CountryStateEntity) {
            return '';
        }

        return $this->translated($state, 'name', $state->getName());
    }

    private function countryName(?CountryEntity $country): string
    {
        if (!$country instanceof CountryEntity) {
            return '';
        }

        return $this->translated($country, 'name', $country->getName());
    }

    private function translated(Entity $entity, string $field, ?string $fallback): string
    {
        $translated = $entity->getTranslation($field);
        if (\is_string($translated) && trim($translated) !== '') {
            return trim($translated);
        }

        return $this->text($fallback);
    }

    private function text(?string $value): string
    {
        return trim($value ?? '');
    }
}
