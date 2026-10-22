<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components;

use Fyrst\ViewsTheme\Resources\views\components\Address;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderAddress\OrderAddressEntity;
use Shopware\Core\System\Country\Aggregate\CountryState\CountryStateEntity;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\Salutation\SalutationEntity;

final class AddressTest extends TestCase
{
    public function testCustomerAddressMapsEachField(): void
    {
        $component = new Address();
        $component->address = $this->customerAddress();
        $component->postMount([]);

        self::assertSame('Frau', $component->salutation);
        self::assertSame('Dr.', $component->title);
        self::assertSame('Frau Juthamas Wisetsuk', $component->fullName);
        self::assertSame('Acme', $component->company);
        self::assertSame('Sales', $component->department);
        self::assertSame('teststrasse 21', $component->street);
        self::assertSame('Floor 2', $component->additionalLine1);
        self::assertSame('Door 4', $component->additionalLine2);
        self::assertSame('0000', $component->zipcode);
        self::assertSame('testort', $component->city);
        self::assertSame('Zürich', $component->countryState);
        self::assertSame('Switzerland', $component->country);
        self::assertSame('+41 00 000 00 00', $component->phone);
        self::assertFalse($component->showWarning);
    }

    public function testOrderAddressMapsEachField(): void
    {
        $address = new OrderAddressEntity();
        $address->setId('order');
        $address->setFirstName('Robert');
        $address->setLastName('Bisovski');
        $address->setStreet('teststrasse 21');
        $address->setZipcode('0000');
        $address->setCity('testort');
        $address->setCountry($this->country('Switzerland', true));

        $component = new Address();
        $component->address = $address;
        $component->postMount([]);

        self::assertSame('', $component->salutation);
        self::assertSame('', $component->title);
        self::assertSame('Robert Bisovski', $component->fullName);
        self::assertSame('', $component->company);
        self::assertSame('', $component->department);
        self::assertSame('teststrasse 21', $component->street);
        self::assertSame('', $component->additionalLine1);
        self::assertSame('', $component->additionalLine2);
        self::assertSame('0000', $component->zipcode);
        self::assertSame('testort', $component->city);
        self::assertSame('', $component->countryState);
        self::assertSame('Switzerland', $component->country);
        self::assertSame('', $component->phone);
        self::assertFalse($component->showWarning);
    }

    public function testTranslatedLabelsWinOverEntityNames(): void
    {
        $salutation = new SalutationEntity();
        $salutation->setId('salutation');
        $salutation->setDisplayName('Mrs.');
        $salutation->setTranslated(['displayName' => 'Frau']);

        $state = new CountryStateEntity();
        $state->setId('state');
        $state->setName('Zurich');
        $state->setTranslated(['name' => 'Zürich']);

        $country = new CountryEntity();
        $country->setId('country');
        $country->setName('Schweiz');
        $country->setShippingAvailable(true);
        $country->setTranslated(['name' => 'Switzerland']);

        $address = $this->customerAddress();
        $address->setSalutation($salutation);
        $address->setCountryState($state);
        $address->setCountry($country);

        $component = new Address();
        $component->address = $address;
        $component->postMount([]);

        self::assertSame('Frau', $component->salutation);
        self::assertSame('Zürich', $component->countryState);
        self::assertSame('Switzerland', $component->country);
    }

    public function testNamesFallBackWhenTranslationIsMissing(): void
    {
        $salutation = new SalutationEntity();
        $salutation->setId('salutation');
        $salutation->setDisplayName('Mrs.');

        $state = new CountryStateEntity();
        $state->setId('state');
        $state->setName('Zurich');

        $country = new CountryEntity();
        $country->setId('country');
        $country->setName('Switzerland');
        $country->setShippingAvailable(true);

        $address = $this->customerAddress();
        $address->setSalutation($salutation);
        $address->setCountryState($state);
        $address->setCountry($country);

        $component = new Address();
        $component->address = $address;
        $component->postMount([]);

        self::assertSame('Mrs.', $component->salutation);
        self::assertSame('Mrs. Juthamas Wisetsuk', $component->fullName);
        self::assertSame('Zurich', $component->countryState);
        self::assertSame('Switzerland', $component->country);
    }

    public function testWarningWhenShippingIsUnavailable(): void
    {
        $address = $this->customerAddress();
        $address->setCountry($this->country('Switzerland', false));

        $component = new Address();
        $component->address = $address;
        $component->showShippingWarning = true;
        $component->postMount([]);

        self::assertTrue($component->showWarning);
        self::assertSame('Switzerland', $component->country);
    }

    public function testWarningWhenCountryIsMissing(): void
    {
        $address = new CustomerAddressEntity();
        $address->setId('bare');
        $address->setFirstName('Juthamas');
        $address->setLastName('Wisetsuk');
        $address->setStreet('teststrasse 21');
        $address->setCity('testort');

        $component = new Address();
        $component->address = $address;
        $component->showShippingWarning = true;
        $component->postMount([]);

        self::assertTrue($component->showWarning);
        self::assertSame('', $component->country);
        self::assertSame('', $component->company);
    }

    public function testWarningStaysOffWhenTheFlagIsOff(): void
    {
        $address = $this->customerAddress();
        $address->setCountry($this->country('Switzerland', false));

        $component = new Address();
        $component->address = $address;
        $component->postMount([]);

        self::assertFalse($component->showWarning);
    }

    public function testNotSpecifiedSalutationIsLeftOffTheName(): void
    {
        $salutation = new SalutationEntity();
        $salutation->setId('salutation');
        $salutation->setSalutationKey('not_specified');
        $salutation->setDisplayName('Not specified');

        $address = $this->customerAddress();
        $address->setSalutation($salutation);

        $component = new Address();
        $component->address = $address;
        $component->postMount([]);

        self::assertSame('', $component->salutation);
        self::assertSame('Juthamas Wisetsuk', $component->fullName);
    }

    public function testMissingAddressClearsFields(): void
    {
        $component = new Address();
        $component->showShippingWarning = true;
        $component->postMount([]);

        self::assertTrue($component->showWarning);
        self::assertSame('', $component->fullName);
        self::assertSame('', $component->street);
        self::assertSame('', $component->country);
    }

    private function customerAddress(): CustomerAddressEntity
    {
        $address = new CustomerAddressEntity();
        $address->setId('customer');
        $address->setFirstName('Juthamas');
        $address->setLastName('Wisetsuk');
        $address->setTitle('Dr.');
        $address->setCompany('Acme');
        $address->setDepartment('Sales');
        $address->setStreet('teststrasse 21');
        $address->setAdditionalAddressLine1('Floor 2');
        $address->setAdditionalAddressLine2('Door 4');
        $address->setZipcode('0000');
        $address->setCity('testort');
        $address->setPhoneNumber('+41 00 000 00 00');

        $salutation = new SalutationEntity();
        $salutation->setId('salutation');
        $salutation->setDisplayName('Mrs.');
        $salutation->setTranslated(['displayName' => 'Frau']);
        $address->setSalutation($salutation);

        $state = new CountryStateEntity();
        $state->setId('state');
        $state->setName('Zurich');
        $state->setTranslated(['name' => 'Zürich']);
        $address->setCountryState($state);

        $address->setCountry($this->country('Switzerland', true));

        return $address;
    }

    private function country(string $name, bool $shippingAvailable): CountryEntity
    {
        $country = new CountryEntity();
        $country->setId('country');
        $country->setName($name);
        $country->setShippingAvailable($shippingAvailable);
        $country->setTranslated(['name' => $name]);

        return $country;
    }
}
