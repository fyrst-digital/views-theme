# Upgrade to ViewsTheme 2.0

ViewsTheme 2.0 moves from the vendor Fyrst to Webflare. The theme works the same, but the Composer package, the PHP namespace and the GitHub repository have new names. Shops that already run 1.x need a few one-time steps when they deploy 2.0.

## What changed

| | 1.x | 2.0 |
|---|---|---|
| Composer package | `fyrst/views-theme` | `webflare/views-theme` |
| PHP namespace | `Fyrst\ViewsTheme` | `Webflare\ViewsTheme` |
| Plugin class | `Fyrst\ViewsTheme\ViewsTheme` | `Webflare\ViewsTheme\ViewsTheme` |
| Repository | `github.com/fyrst-digital/views-theme` | `github.com/webflare-sh/views-theme` |
| Author and footer credit | Fyrst, fyrst.dev | Webflare, webflare.sh |

## What stays the same

The plugin is still named `ViewsTheme`, so everything Shopware stores under that name is kept:

- the theme's sales channel assignment and its theme settings
- the plugin configuration (`ViewsTheme.config.*`)
- Twig templates under `@ViewsTheme` and the `<twig:…>` component names
- snippets, routes (`frontend.views-theme.*`), JS components and the `bundles/viewstheme` assets
- the preferred delivery date order custom field

Child themes that only override Twig, SCSS, JS or snippets need no changes.

## Upgrade steps

Run steps 1 to 3 in the same deployment. Step 2 must run after the 2.0 code is on the server and before `plugin:refresh`.

### 1. Switch the Composer package

```bash
composer remove fyrst/views-theme --no-update
composer require webflare/views-theme:^2.0
```

Commit `composer.json` and `composer.lock`. If you install from a VCS repository instead of Packagist, change its URL to `https://github.com/webflare-sh/views-theme`. 2.0 replaces `fyrst/views-theme`, so Composer never installs both.

### 2. Update the plugin row in the database

Shopware recognises an installed plugin by the class name stored in the `plugin` table. That row still says `Fyrst\ViewsTheme\ViewsTheme`, which no longer exists in 2.0. Until the row is updated:

- Shopware skips the plugin, so the theme is not loaded and the storefront breaks.
- `plugin:refresh` fails with a duplicate entry for `ViewsTheme`.

Run this statement once per shop database:

```sql
UPDATE `plugin`
SET `base_class` = 'Webflare\\ViewsTheme\\ViewsTheme'
WHERE `base_class` = 'Fyrst\\ViewsTheme\\ViewsTheme';
```

It changes one row on a shop that runs 1.x, and none on a fresh install or a second run, so it is safe to repeat. The plugin keeps its ID, its installed and active state and its configuration.

**When to run it:** after the 2.0 code is on the server and before `plugin:refresh` or `cache:clear`. Do not run it earlier: 1.x code cannot find the new class name and skips the plugin in the same way. The storefront is down between the code switch and this statement, so run both in the same deployment step or turn on maintenance mode.

**Why it is not a migration:** plugin code, migrations included, only runs once Shopware has loaded the plugin, and Shopware cannot load it until this row is fixed. The statement has to run outside the plugin.

#### With shopware/deployment-helper

Add a one-time task to `.shopware-project.yml`. With `when: before` it runs ahead of `plugin:refresh`, and the helper records it so it runs only once per database:

```yaml
deployment:
  one-time-tasks:
    - id: views-theme-2.0-plugin-class
      when: before
      script: |
        %php.bin% <<'PHP'
        <?php
        require 'vendor/autoload.php';
        $params = (new Doctrine\DBAL\Tools\DsnParser(['mysql' => 'pdo_mysql']))->parse(getenv('DATABASE_URL'));
        $rows = Doctrine\DBAL\DriverManager::getConnection($params)->executeStatement(
            'UPDATE `plugin` SET `base_class` = ? WHERE `base_class` = ?',
            ['Webflare\ViewsTheme\ViewsTheme', 'Fyrst\ViewsTheme\ViewsTheme']
        );
        echo "ViewsTheme: {$rows} plugin row(s) updated\n";
        PHP
```

The helper then runs `plugin:refresh`, `plugin:update` and the theme compile itself, so you can skip step 3.

#### Without the deployment helper

Run the statement with your database client (for example the `mysql` CLI, Adminer or phpMyAdmin) in your deployment step, then continue with step 3.

### 3. Refresh and update the plugin

```bash
bin/console plugin:refresh
bin/console plugin:update ViewsTheme
```

`plugin:refresh` also stores the new package name, autoload paths and author.

### 4. Update PHP code that uses ViewsTheme classes

This is only needed for child themes or plugins whose PHP code or service configuration refers to ViewsTheme classes. Replace `Fyrst\ViewsTheme\` with `Webflare\ViewsTheme\` in:

- `use` statements and classes that extend ViewsTheme component classes
- service IDs in `services.xml` or YAML, for example `decorates` and `<argument type="service" id="…"/>`, because ViewsTheme's service IDs are its class names
- any other string that holds a ViewsTheme class name, for example Twig `constant()` calls

2.0 has no aliases for the old names. If a reference is missed, building the service container fails with a missing class or service.

### 5. Check the footer credit

The default theme credit in the footer (`Page:Footer:Bottom`) now links to webflare.sh instead of fyrst.dev. Shops that pass their own `brand` keep theirs. See [Footer](docs/features/footer.md).

## Rolling back to 1.x

Switch the Composer package back to `fyrst/views-theme:^1.1`, then run the reverse statement before `plugin:refresh`:

```sql
UPDATE `plugin`
SET `base_class` = 'Fyrst\\ViewsTheme\\ViewsTheme'
WHERE `base_class` = 'Webflare\\ViewsTheme\\ViewsTheme';
```

If you used the one-time task, unmark it so it runs again on the next upgrade:

```bash
vendor/bin/shopware-deployment-helper one-time-task:unmark views-theme-2.0-plugin-class
```
