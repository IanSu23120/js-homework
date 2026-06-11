import django.db.models.deletion
from django.db import migrations, models


def assign_existing_suggestions_to_trip(apps, schema_editor):
    Suggestion = apps.get_model('planner', 'Suggestion')

    for suggestion in Suggestion.objects.filter(trip__isnull=True):
        trip = suggestion.group.trips.order_by('created_at').first()
        if trip:
            suggestion.trip = trip
            suggestion.save(update_fields=['trip'])


class Migration(migrations.Migration):

    dependencies = [
        ('planner', '0004_suggestion_voting_and_acceptance'),
    ]

    operations = [
        migrations.AddField(
            model_name='suggestion',
            name='trip',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='suggestions',
                to='planner.trip',
            ),
        ),
        migrations.RunPython(
            assign_existing_suggestions_to_trip,
            migrations.RunPython.noop,
        ),
        migrations.RemoveField(
            model_name='suggestion',
            name='lat',
        ),
        migrations.RemoveField(
            model_name='suggestion',
            name='lng',
        ),
    ]
