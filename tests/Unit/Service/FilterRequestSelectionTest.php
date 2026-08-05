<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Service;

use Fyrst\ViewsTheme\Service\FilterRequestSelection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class FilterRequestSelectionTest extends TestCase
{
    private FilterRequestSelection $selection;

    protected function setUp(): void
    {
        $this->selection = new FilterRequestSelection();
    }

    public function testSplitParamPipeString(): void
    {
        self::assertSame(['a', 'b', 'c'], $this->selection->splitParam('a|b|c'));
    }

    public function testSplitParamArrayFiltersEmpty(): void
    {
        self::assertSame(['x', 'y'], $this->selection->splitParam(['x', '', 'y']));
    }

    public function testSplitParamEmpty(): void
    {
        self::assertSame([], $this->selection->splitParam(null));
        self::assertSame([], $this->selection->splitParam(''));
        self::assertSame([], $this->selection->splitParam([]));
    }

    public function testSelectedFromRequestKeys(): void
    {
        $request = new Request([
            'manufacturer' => 'm1|m2',
            'properties' => ['p1', 'p2'],
            'rating' => '3',
            'shipping-free' => '1',
        ]);

        $selected = $this->selection->selectedFromRequest($request);

        self::assertSame(['m1', 'm2'], $selected['manufacturer']);
        self::assertSame(['p1', 'p2'], $selected['properties']);
        self::assertSame(['3'], $selected['rating']);
        self::assertSame(['1'], $selected['shipping-free']);
    }

    public function testRequestHasFilterParams(): void
    {
        self::assertFalse($this->selection->requestHasFilterParams(new Request()));
        self::assertTrue($this->selection->requestHasFilterParams(new Request(['manufacturer' => 'x'])));
        self::assertTrue($this->selection->requestHasFilterParams(new Request(['min-price' => '10'])));
        self::assertTrue($this->selection->requestHasFilterParams(new Request(['properties' => ['a']])));
        self::assertFalse($this->selection->requestHasFilterParams(new Request(['manufacturer' => ''])));
    }
}
