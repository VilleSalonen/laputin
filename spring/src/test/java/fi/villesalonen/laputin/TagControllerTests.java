package fi.villesalonen.laputin;

import static org.assertj.core.api.Assertions.assertThat;
import fi.villesalonen.laputin.entities.TagEntity;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public class TagControllerTests {
    @Value("${local.server.port}")
    private int randomServerPort;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private TagRepository tagRepository;

    @SuppressWarnings("resource")
    @Container
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:15.3")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
    }

    @Test
    public void whenGettingAllTags_givenTagsExists_thenReturnsTags() {
        // Arrange
        TagEntity tag1 = new TagEntity();
        tag1.setName("Tag1");
        tagRepository.save(tag1);

        TagEntity tag2 = new TagEntity();
        tag2.setName("Tag2");
        tagRepository.save(tag2);

        // Act
        ResponseEntity<List<TagEntity>> response = restTemplate.exchange(
            "http://localhost:" + randomServerPort + "/tags",
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<>() {}
        );

        // Assert
        List<TagEntity> returnedTags = response.getBody();
        assertThat(returnedTags)
            .extracting(TagEntity::getName)
            .containsExactlyInAnyOrder("Tag1", "Tag2");
    }
}
