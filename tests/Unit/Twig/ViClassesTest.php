<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Twig;

use Fyrst\ViewsTheme\Twig\ViClasses;
use PHPUnit\Framework\TestCase;

class ViClassesTest extends TestCase
{
    private ViClasses $extension;

    protected function setUp(): void
    {
        $this->extension = new ViClasses();
    }

    public function testMergeAppendsAndDedupesClassLists(): void
    {
        $result = $this->extension->defineClasses(
            ['main' => ['a', 'b']],
            ['main' => ['b', 'c']],
        );

        self::assertSame(['a', 'b', 'c'], $result['main']);
    }

    public function testReplaceListReplacesOnlySelectedKeys(): void
    {
        $result = $this->extension->defineClasses(
            [
                'label' => ['line-item-label', 'product-name'],
                'footer' => ['line-item-footer'],
            ],
            [
                'label' => ['line-item-label', 'discount-name'],
                'footer' => ['extra'],
            ],
            [
                'replace' => ['label'],
            ],
        );

        self::assertSame(['line-item-label', 'discount-name'], $result['label']);
        self::assertSame(['line-item-footer', 'extra'], $result['footer']);
    }

    public function testReplaceClassesOptionAlias(): void
    {
        $result = $this->extension->defineClasses(
            ['main' => ['a'], 'side' => ['x']],
            ['main' => ['b'], 'side' => ['y']],
            [
                'replaceClasses' => ['main'],
            ],
        );

        self::assertSame(['b'], $result['main']);
        self::assertSame(['x', 'y'], $result['side']);
    }

    public function testNestedMapsMergeRecursively(): void
    {
        $result = $this->extension->defineClasses(
            [
                'input' => [
                    'label' => ['form-label'],
                    'date' => ['form-control'],
                ],
            ],
            [
                'input' => [
                    'date' => ['is-invalid'],
                    'helpText' => ['form-text'],
                ],
            ],
        );

        self::assertSame(['form-label'], $result['input']['label']);
        self::assertSame(['form-control', 'is-invalid'], $result['input']['date']);
        self::assertSame(['form-text'], $result['input']['helpText']);
    }

    public function testVariantsApplyForMatchingProps(): void
    {
        $result = $this->extension->defineClasses(
            ['root' => ['alert', 'd-flex']],
            [],
            [
                'variants' => [
                    'type' => [
                        'danger' => ['root' => ['alert-danger']],
                        'success' => ['root' => ['alert-success']],
                    ],
                    'dismissible' => [
                        'true' => ['root' => ['alert-dismissible', 'fade', 'show']],
                    ],
                ],
                'props' => [
                    'type' => 'danger',
                    'dismissible' => true,
                ],
            ],
        );

        self::assertSame(
            ['alert', 'd-flex', 'alert-danger', 'alert-dismissible', 'fade', 'show'],
            $result['root'],
        );
    }

    public function testVariantsIgnoreMissingProps(): void
    {
        $result = $this->extension->defineClasses(
            ['root' => ['alert']],
            [],
            [
                'variants' => [
                    'type' => [
                        'danger' => ['root' => ['alert-danger']],
                    ],
                ],
                'props' => [
                    'type' => null,
                ],
            ],
        );

        self::assertSame(['alert'], $result['root']);
    }

    public function testCustomOverridesApplyAfterVariants(): void
    {
        $result = $this->extension->defineClasses(
            ['root' => ['alert']],
            ['root' => ['custom']],
            [
                'variants' => [
                    'type' => [
                        'info' => ['root' => ['alert-info']],
                    ],
                ],
                'props' => [
                    'type' => 'info',
                ],
            ],
        );

        self::assertSame(['alert', 'alert-info', 'custom'], $result['root']);
    }

    public function testCustomReplaceAfterVariants(): void
    {
        $result = $this->extension->defineClasses(
            ['root' => ['alert']],
            ['root' => ['custom-only']],
            [
                'replace' => ['root'],
                'variants' => [
                    'type' => [
                        'info' => ['root' => ['alert-info']],
                    ],
                ],
                'props' => [
                    'type' => 'info',
                ],
            ],
        );

        self::assertSame(['custom-only'], $result['root']);
    }

    public function testAttrClassesOutputsAttributeMarkup(): void
    {
        $markup = $this->extension->attrClasses(['a', 'b', 'a', '', null]);

        self::assertSame('class="a b"', (string) $markup);
    }

    public function testAttrClassesEmptyReturnsEmptyString(): void
    {
        self::assertSame('', (string) $this->extension->attrClasses([]));
        self::assertSame('', (string) $this->extension->attrClasses(null));
    }

    public function testClassesOutputsBareString(): void
    {
        self::assertSame('a b', $this->extension->classes(['a', 'b', 'a']));
        self::assertSame('', $this->extension->classes([]));
        self::assertSame('', $this->extension->classes(null));
    }

    public function testStringLeafNormalization(): void
    {
        $result = $this->extension->defineClasses(
            ['main' => 'foo bar'],
            ['main' => 'baz'],
        );

        self::assertSame(['foo', 'bar', 'baz'], $result['main']);
    }

    public function testEmptyNestedSlotPreserved(): void
    {
        $result = $this->extension->defineClasses(
            [
                'quantityInput' => [
                    'group' => ['variants-grid-quantity-group'],
                ],
                'item' => [],
            ],
            [
                'item' => ['summary-item-total'],
            ],
        );

        self::assertSame(['variants-grid-quantity-group'], $result['quantityInput']['group']);
        self::assertSame(['summary-item-total'], $result['item']);
    }

    public function testEmptyOptionsIsMergeOnly(): void
    {
        $result = $this->extension->defineClasses(
            ['main' => ['a']],
            ['main' => ['b']],
            [],
        );

        self::assertSame(['a', 'b'], $result['main']);
    }
}
