<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Service;

use Fyrst\ViewsTheme\Service\FooterCmsUrlResolver;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Payment\PaymentMethodCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Content\Category\CategoryCollection;
use Shopware\Core\Content\Category\SalesChannel\SalesChannelCategoryEntity;
use Shopware\Core\Content\Category\Tree\Tree;
use Shopware\Core\Content\Category\Tree\TreeItem;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Pagelet\Footer\FooterPagelet;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

final class FooterCmsUrlResolverTest extends TestCase
{
    public function testResolvePrefersServiceMenuSeoUrl(): void
    {
        $resolver = $this->resolver(
            generate: fn (string $name, array $params): string => 'fallback:' . ($params['id'] ?? ''),
        );

        $url = $resolver->resolve('cms-contact', $this->footer(
            serviceMenu: [$this->category('menu-1', 'cms-contact', '/contact')],
        ));

        self::assertSame('/contact', $url);
    }

    public function testResolvePrefersNavTreeSeoUrlOverFallback(): void
    {
        $resolver = $this->resolver(
            generate: fn (string $name, array $params): string => 'fallback:' . ($params['id'] ?? ''),
        );

        $child = $this->category('child-1', 'cms-ship', '/shipping');
        $root = $this->category('root-1', 'cms-other', '/other');

        $url = $resolver->resolve('cms-ship', $this->footer(
            tree: [new TreeItem($root, [new TreeItem($child, [])])],
        ));

        self::assertSame('/shipping', $url);
    }

    public function testResolveFallsBackToCmsRoute(): void
    {
        $resolver = $this->resolver(
            generate: function (string $name, array $params): string {
                self::assertSame('frontend.cms.page.full', $name);
                self::assertSame('cms-missing', $params['id'] ?? null);

                return 'generated:' . $params['id'];
            },
        );

        $url = $resolver->resolve('cms-missing', $this->footer());

        self::assertSame('generated:cms-missing', $url);
    }

    public function testResolveEmptyIdIsHash(): void
    {
        $seo = $this->createMock(SeoUrlPlaceholderHandlerInterface::class);
        $seo->expects(self::never())->method('generate');

        $resolver = new FooterCmsUrlResolver(
            $seo,
            $this->createStub(SystemConfigService::class),
            $this->accessor(),
        );

        self::assertSame('#', $resolver->resolve(null, $this->footer()));
        self::assertSame('#', $resolver->resolve('', $this->footer()));
    }

    public function testUrlsReadsConfigAndRevocationGate(): void
    {
        $config = $this->createMock(SystemConfigService::class);
        $config->method('getString')->willReturnMap([
            ['core.basicInformation.contactPage', 'sc-1', 'cms-contact'],
            ['core.basicInformation.revocationRequestPage', 'sc-1', 'cms-revocation'],
            ['core.basicInformation.shippingPaymentInfoPage', 'sc-1', 'cms-ship'],
        ]);
        $config->method('getBool')->with('core.basicInformation.showRevocationButton', 'sc-1')->willReturn(true);

        $context = $this->createStub(SalesChannelContext::class);
        $context->method('getSalesChannelId')->willReturn('sc-1');

        $seo = $this->createStub(SeoUrlPlaceholderHandlerInterface::class);
        $seo->method('generate')->willReturnCallback(
            fn (string $name, array $params): string => 'generated:' . ($params['id'] ?? ''),
        );

        $resolver = new FooterCmsUrlResolver($seo, $config, $this->accessor($context));
        $urls = $resolver->urls($this->footer(
            serviceMenu: [
                $this->category('menu-1', 'cms-contact', '/contact'),
            ],
        ));

        self::assertSame('/contact', $urls['contactUrl']);
        self::assertSame('generated:cms-revocation', $urls['revocationUrl']);
        self::assertSame('generated:cms-ship', $urls['shippingUrl']);
        self::assertTrue($urls['showRevocation']);
    }

    public function testUrlsHidesRevocationWhenConfigOff(): void
    {
        $config = $this->createMock(SystemConfigService::class);
        $config->method('getString')->willReturn('cms-revocation');
        $config->method('getBool')->willReturn(false);

        $resolver = new FooterCmsUrlResolver(
            $this->createStub(SeoUrlPlaceholderHandlerInterface::class),
            $config,
            $this->accessor(),
        );

        $urls = $resolver->urls($this->footer());

        self::assertFalse($urls['showRevocation']);
    }

    /**
     * @param callable(string, array<string, mixed>): string $generate
     */
    private function resolver(callable $generate): FooterCmsUrlResolver
    {
        $seo = $this->createMock(SeoUrlPlaceholderHandlerInterface::class);
        $seo->method('generate')->willReturnCallback($generate);

        return new FooterCmsUrlResolver(
            $seo,
            $this->createStub(SystemConfigService::class),
            $this->accessor(),
        );
    }

    private function accessor(?SalesChannelContext $context = null): SalesChannelContextAccessor
    {
        $stack = new RequestStack();
        if ($context !== null) {
            $request = new Request();
            $request->attributes->set(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT, $context);
            $stack->push($request);
        }

        return new SalesChannelContextAccessor($stack);
    }

    /**
     * @param list<SalesChannelCategoryEntity> $serviceMenu
     * @param list<TreeItem> $tree
     */
    private function footer(array $serviceMenu = [], array $tree = []): FooterPagelet
    {
        $navigation = $tree === [] ? null : new Tree(null, $tree);

        return new FooterPagelet(
            $navigation,
            new CategoryCollection($serviceMenu),
            new PaymentMethodCollection(),
            new ShippingMethodCollection(),
        );
    }

    private function category(string $id, string $cmsPageId, string $seoUrl): SalesChannelCategoryEntity
    {
        $category = new SalesChannelCategoryEntity();
        $category->setId($id);
        $category->setCmsPageId($cmsPageId);
        $category->setSeoUrl($seoUrl);

        return $category;
    }
}
