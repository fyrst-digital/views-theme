<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\storefront;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class AccountBridgeOwnershipTest extends TestCase
{
    /**
     * @return iterable<string, array{0: string}>
     */
    public static function accountBridgeProvider(): iterable
    {
        $root = dirname(__DIR__, 5) . '/src/Resources/views/storefront';
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root . '/page/account', \FilesystemIterator::SKIP_DOTS),
        );
        foreach ($files as $file) {
            if ($file->isFile() && str_ends_with($file->getFilename(), '.html.twig')) {
                $relative = substr($file->getPathname(), strlen($root) + 1);
                yield $relative => [$file->getPathname()];
            }
        }

        $componentDir = $root . '/component/account';
        foreach (glob($componentDir . '/*.html.twig') ?: [] as $path) {
            $relative = substr($path, strlen($root) + 1);
            yield $relative => [$path];
        }
    }

    #[DataProvider('accountBridgeProvider')]
    public function testAccountBridgeOnlyMountsThemeTags(string $path): void
    {
        $source = (string) file_get_contents($path);

        self::assertStringContainsString("{% sw_extends '@Storefront/", $source);
        self::assertMatchesRegularExpression('/<twig:ViewsTheme:[A-Za-z:]+/', $source);
        self::assertDoesNotMatchRegularExpression('/data-form-(handler|auto-submit|ajax-submit)/', $source);
        self::assertStringNotContainsString('data-order-detail-loader', $source);
        self::assertStringNotContainsString('data-address-manager', $source);
        self::assertStringNotContainsString('account-aside', $source);
        self::assertStringNotContainsString('js-form-field-toggle-guest-mode', $source);
    }

    /**
     * @return iterable<string, array{0: string}>
     */
    public static function loggedInPageLayoutProvider(): iterable
    {
        $root = dirname(__DIR__, 5) . '/src/Resources/views/storefront/page/account';

        yield 'page/account/index.html.twig' => [$root . '/index.html.twig'];
        yield 'page/account/profile/index.html.twig' => [$root . '/profile/index.html.twig'];
        yield 'page/account/addressbook/index.html.twig' => [$root . '/addressbook/index.html.twig'];
        yield 'page/account/addressbook/create.html.twig' => [$root . '/addressbook/create.html.twig'];
        yield 'page/account/addressbook/edit.html.twig' => [$root . '/addressbook/edit.html.twig'];
        yield 'page/account/order-history/index.html.twig' => [$root . '/order-history/index.html.twig'];
    }

    #[DataProvider('loggedInPageLayoutProvider')]
    public function testLoggedInPageMountsAccountPage(string $path): void
    {
        $source = (string) file_get_contents($path);

        self::assertStringContainsString("{% block page_account %}", $source);
        self::assertStringContainsString('<twig:ViewsTheme:Account:Page>', $source);
        self::assertStringNotContainsString('page_account_main_content', $source);
    }

    public function testAccountPageShellDoesNotNestMainContentBlock(): void
    {
        $path = dirname(__DIR__, 5) . '/src/Resources/views/storefront/page/account/_page.html.twig';
        $source = (string) file_get_contents($path);

        self::assertStringContainsString('<twig:ViewsTheme:Account:Page />', $source);
        self::assertStringNotContainsString('page_account_main_content', $source);
    }
}
