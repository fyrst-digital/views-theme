<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Service;

use Fyrst\ViewsTheme\Service\ComponentData;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
use Shopware\Core\System\Country\CountryEntity;
use Symfony\Component\HttpFoundation\Request;

final class ComponentDataTest extends TestCase
{
    public function testGetFromArray(): void
    {
        self::assertSame('DE', ComponentData::get(['iso' => 'DE'], 'iso'));
        self::assertNull(ComponentData::get(['iso' => 'DE'], 'missing'));
    }

    public function testGetFromDataBag(): void
    {
        $bag = new DataBag(['email' => 'a@b.c']);

        self::assertSame('a@b.c', ComponentData::get($bag, 'email'));
        self::assertNull(ComponentData::get($bag, 'missing'));
    }

    public function testGetFromEntity(): void
    {
        $country = new CountryEntity();
        $country->setId('id-1');
        $country->setName('Germany');

        self::assertSame('Germany', ComponentData::get($country, 'name'));
        self::assertNull(ComponentData::get($country, 'missing'));
    }

    public function testScalar(): void
    {
        self::assertSame('1', ComponentData::scalar(1));
        self::assertSame('x', ComponentData::scalar('x'));
        self::assertNull(ComponentData::scalar(''));
        self::assertNull(ComponentData::scalar(null));
        self::assertNull(ComponentData::scalar([]));
    }

    public function testFieldPrefixed(): void
    {
        $field = ComponentData::field('pre', 'billingAddress', 'AddressCity', 'city', 'Berlin', true, 'address-level2');

        self::assertSame('prebillingAddressAddressCity', $field['id']);
        self::assertSame('billingAddress[city]', $field['name']);
        self::assertSame('Berlin', $field['value']);
        self::assertSame('/billingAddress/city', $field['violationPath']);
        self::assertSame('address-level2', $field['autocomplete']);
    }

    public function testFieldUnprefixed(): void
    {
        $field = ComponentData::field('', '', 'personalBirthday-day', 'birthdayDay', 3, false);

        self::assertSame('personalBirthday-day', $field['id']);
        self::assertSame('birthdayDay', $field['name']);
        self::assertSame('/birthdayDay', $field['violationPath']);
        self::assertArrayNotHasKey('autocomplete', $field);
    }

    public function testPageAccessorsNull(): void
    {
        self::assertNull(ComponentData::pageCountries(null));
        self::assertNull(ComponentData::pageSalutations(new \stdClass()));
    }

    public function testIsEmpty(): void
    {
        self::assertTrue(ComponentData::isEmpty(null));
        self::assertTrue(ComponentData::isEmpty([]));
        self::assertTrue(ComponentData::isEmpty(new DataBag()));
        self::assertFalse(ComponentData::isEmpty(['email' => 'a@b.c']));
        self::assertFalse(ComponentData::isEmpty(new DataBag(['email' => 'a@b.c'])));
        self::assertFalse(ComponentData::isEmpty(new \stdClass()));
    }

    public function testGetBoolean(): void
    {
        self::assertTrue(ComponentData::getBoolean(['createCustomerAccount' => 'true'], 'createCustomerAccount'));
        self::assertTrue(ComponentData::getBoolean(['createCustomerAccount' => '1'], 'createCustomerAccount'));
        self::assertTrue(ComponentData::getBoolean(['createCustomerAccount' => true], 'createCustomerAccount'));
        self::assertFalse(ComponentData::getBoolean(['createCustomerAccount' => '0'], 'createCustomerAccount'));
        self::assertFalse(ComponentData::getBoolean(['email' => 'a@b.c'], 'createCustomerAccount'));
        self::assertFalse(ComponentData::getBoolean(new DataBag(['email' => 'a@b.c']), 'createCustomerAccount'));
        self::assertFalse(ComponentData::getBoolean(null, 'createCustomerAccount'));
    }

    public function testFormViolations(): void
    {
        $current = new \stdClass();
        $fromRequest = new \stdClass();
        $request = new Request();
        $request->attributes->set('formViolations', $fromRequest);

        self::assertSame($current, ComponentData::formViolations($current, $request));
        self::assertSame($fromRequest, ComponentData::formViolations(null, $request));
        self::assertNull(ComponentData::formViolations(null, new Request()));
        self::assertNull(ComponentData::formViolations(null, null));
    }
}
