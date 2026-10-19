<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Service;

use Fyrst\ViewsTheme\Service\ShippingMethodPriceResolver;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Delivery\DeliveryBuilder;
use Shopware\Core\Checkout\Cart\Delivery\DeliveryCalculator;
use Shopware\Core\Checkout\Cart\Delivery\DeliveryProcessor;
use Shopware\Core\Checkout\Cart\Delivery\Struct\Delivery;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryCollection;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryDate;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryPositionCollection;
use Shopware\Core\Checkout\Cart\Delivery\Struct\ShippingLocation;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTaxCollection;
use Shopware\Core\Checkout\Cart\Tax\Struct\TaxRuleCollection;
use Shopware\Core\Checkout\Shipping\Cart\Error\ShippingMethodBlockedError;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

final class ShippingMethodPriceResolverTest extends TestCase
{
    public function testMatchingDeliveryUsesCartTotalWithoutCalculating(): void
    {
        $method = $this->method('standard');
        $cart = new Cart('customer');
        $cart->setDeliveries(new DeliveryCollection([$this->delivery($method, 4.9)]));

        $calculator = $this->createMock(DeliveryCalculator::class);
        $calculator->expects(self::never())->method('calculate');

        $builder = $this->createMock(DeliveryBuilder::class);
        $builder->expects(self::never())->method('buildByUsingShippingMethod');

        $resolver = new ShippingMethodPriceResolver(
            $builder,
            $calculator,
            $this->repository(new ShippingMethodCollection([$method])),
        );

        $quotes = $resolver->resolve($cart, new ShippingMethodCollection([$method]), $this->context());

        self::assertSame([
            'standard' => 4.9,
        ], $quotes);
    }

    public function testUnselectedMethodIsQuotedOnAScratchCart(): void
    {
        $method = $this->method('express');
        $cart = new Cart('customer');
        $cart->addExtension(
            DeliveryProcessor::MANUAL_SHIPPING_COSTS,
            $this->price(3.0),
        );

        $quoted = $this->delivery($method, 0.0);

        $builder = $this->createMock(DeliveryBuilder::class);
        $builder->expects(self::once())
            ->method('buildByUsingShippingMethod')
            ->willReturnCallback(function (Cart $scratch) use ($cart, $quoted): DeliveryCollection {
                self::assertNotSame($cart, $scratch);
                self::assertNull($scratch->getExtension(DeliveryProcessor::MANUAL_SHIPPING_COSTS));

                return new DeliveryCollection([$quoted]);
            });

        $calculator = $this->createMock(DeliveryCalculator::class);
        $calculator->expects(self::once())
            ->method('calculate')
            ->willReturnCallback(function (mixed $data, Cart $scratch) use ($cart, $quoted): void {
                self::assertNotSame($cart, $scratch);
                $quoted->setShippingCosts($this->price(12.5));
                $scratch->addErrors(new ShippingMethodBlockedError('Express', 'express', 'probe'));
            });

        $resolver = new ShippingMethodPriceResolver(
            $builder,
            $calculator,
            $this->repository(new ShippingMethodCollection([$method])),
        );

        $quotes = $resolver->resolve($cart, new ShippingMethodCollection([$method]), $this->context());

        self::assertSame([], $quotes);
        self::assertSame(0, $cart->getErrors()->count());
    }

    public function testUnselectedMethodReturnsCalculatedTotal(): void
    {
        $method = $this->method('express');
        $cart = new Cart('customer');
        $quoted = $this->delivery($method, 0.0);

        $builder = $this->createStub(DeliveryBuilder::class);
        $builder->method('buildByUsingShippingMethod')
            ->willReturn(new DeliveryCollection([$quoted]));

        $calculator = $this->createMock(DeliveryCalculator::class);
        $calculator->expects(self::once())
            ->method('calculate')
            ->willReturnCallback(function () use ($quoted): void {
                $quoted->setShippingCosts($this->price(12.5));
            });

        $resolver = new ShippingMethodPriceResolver(
            $builder,
            $calculator,
            $this->repository(new ShippingMethodCollection([$method])),
        );

        $quotes = $resolver->resolve($cart, new ShippingMethodCollection([$method]), $this->context());

        self::assertSame([
            'express' => 12.5,
        ], $quotes);
        self::assertSame(0, $cart->getErrors()->count());
    }

    private function method(string $id): ShippingMethodEntity
    {
        $method = new ShippingMethodEntity();
        $method->setId($id);

        return $method;
    }

    private function delivery(ShippingMethodEntity $method, float $total): Delivery
    {
        return new Delivery(
            new DeliveryPositionCollection(),
            new DeliveryDate(new \DateTimeImmutable('2026-01-01'), new \DateTimeImmutable('2026-01-02')),
            $method,
            ShippingLocation::createFromCountry(new CountryEntity()),
            $this->price($total),
        );
    }

    private function price(float $total): CalculatedPrice
    {
        return new CalculatedPrice($total, $total, new CalculatedTaxCollection(), new TaxRuleCollection());
    }

    private function context(): SalesChannelContext
    {
        $context = $this->createStub(SalesChannelContext::class);
        $context->method('getContext')->willReturn(Context::createDefaultContext());

        return $context;
    }

    private function repository(ShippingMethodCollection $methods): EntityRepository
    {
        $result = new EntitySearchResult(
            'shipping_method',
            $methods->count(),
            $methods,
            null,
            new Criteria($methods->getIds()),
            Context::createDefaultContext(),
        );

        $repository = $this->createStub(EntityRepository::class);
        $repository->method('search')->willReturn($result);

        return $repository;
    }
}
