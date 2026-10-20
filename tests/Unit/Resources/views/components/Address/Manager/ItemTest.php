<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Address\Manager;

use Fyrst\ViewsTheme\Resources\views\components\Address\Manager\Item;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\System\Country\CountryEntity;

final class ItemTest extends TestCase
{
    public function testPersonAndCompanyBuildLinesAndDefault(): void
    {
        $country = $this->country('Germany', true);
        $country->setTranslated(['name' => 'Deutschland']);

        $address = $this->address('addr-1', $country);
        $address->setFirstName('  Jane ');
        $address->setLastName(' Doe ');
        $address->setCompany('  Acme GmbH  ');
        $address->setStreet('  Main St  ');
        $address->setAdditionalAddressLine1('  Floor 2  ');
        $address->setAdditionalAddressLine2('   ');
        $address->setZipcode(' 10115 ');
        $address->setCity(' Berlin ');

        $component = $this->mount($address, 'shipping', 'addr-1');

        self::assertSame('addr-1', $component->addressId);
        self::assertSame('vi-address-shipping-addr-1', $component->radioId);
        self::assertSame('Jane Doe', $component->name);
        self::assertTrue($component->showCompany);
        self::assertSame('Acme GmbH', $component->company);
        self::assertSame('Floor 2', $component->extra1);
        self::assertSame('', $component->extra2);
        self::assertSame('Main St', $component->street);
        self::assertSame('10115 Berlin, Deutschland', $component->cityLine);
        self::assertSame('Main St, 10115 Berlin', $component->summary);
        self::assertTrue($component->isDefault);
        self::assertFalse($component->shippingBlocked);
    }

    public function testCompanyOnlyOmitsCompanyLineAndFallsBackToCountryName(): void
    {
        $address = $this->address('addr-2', $this->country('Germany', true));
        $address->setFirstName(' ');
        $address->setLastName(' ');
        $address->setCompany('Acme');
        $address->setStreet('');
        $address->setZipcode('10115');
        $address->setCity('Berlin');

        $component = $this->mount($address, 'shipping', null);

        self::assertSame('Acme', $component->name);
        self::assertFalse($component->showCompany);
        self::assertSame('Acme', $component->company);
        self::assertSame('10115 Berlin, Germany', $component->cityLine);
        self::assertSame('10115 Berlin', $component->summary);
        self::assertFalse($component->isDefault);
    }

    public function testEmptyDefaultIdIsNotDefault(): void
    {
        $address = $this->address('addr-3', $this->country('Germany', true));
        $component = $this->mount($address, 'billing', '');

        self::assertFalse($component->isDefault);
        self::assertSame('vi-address-billing-addr-3', $component->radioId);
    }

    public function testShippingBlockDependsOnTypeAndCountry(): void
    {
        $blocked = $this->mount($this->address('addr-4', $this->country('Germany', false)), 'shipping', null);
        self::assertTrue($blocked->shippingBlocked);

        $billing = $this->mount($this->address('addr-4', $this->country('Germany', false)), 'billing', null);
        self::assertFalse($billing->shippingBlocked);

        $missing = $this->mount($this->address('addr-5', null), 'shipping', null);
        self::assertTrue($missing->shippingBlocked);
        self::assertSame('10115 Berlin', $missing->cityLine);
        self::assertSame('Main St, 10115 Berlin', $missing->summary);
    }

    public function testNonEntityAddressStaysBlank(): void
    {
        $component = new Item();
        $component->address = ['id' => 'nope'];
        $component->type = 'shipping';
        $component->postMount([]);

        self::assertSame('', $component->addressId);
        self::assertSame('', $component->radioId);
        self::assertSame('', $component->name);
        self::assertSame('', $component->cityLine);
        self::assertSame('', $component->summary);
        self::assertFalse($component->showCompany);
        self::assertFalse($component->isDefault);
        self::assertFalse($component->shippingBlocked);
    }

    private function mount(CustomerAddressEntity $address, string $type, ?string $defaultId): Item
    {
        $component = new Item();
        $component->address = $address;
        $component->type = $type;
        $component->defaultId = $defaultId;
        $component->postMount([]);

        return $component;
    }

    private function address(string $id, ?CountryEntity $country): CustomerAddressEntity
    {
        $address = new CustomerAddressEntity();
        $address->setId($id);
        $address->setFirstName('Jane');
        $address->setLastName('Doe');
        $address->setStreet('Main St');
        $address->setZipcode('10115');
        $address->setCity('Berlin');
        if ($country !== null) {
            $address->setCountry($country);
        }

        return $address;
    }

    private function country(string $name, bool $shippingAvailable): CountryEntity
    {
        $country = new CountryEntity();
        $country->setId('country');
        $country->setName($name);
        $country->setShippingAvailable($shippingAvailable);

        return $country;
    }
}
